// Define the API URL and fetch the fields
const apiUrl = `${baseUrl}/TicketType/${ticketTypeId}?published_id=${publishedId}`
let formFields = [];

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    formFields = data.fields;
    renderForm(formFields);
    initializeVisibility(); 
  });

function handleField(field) {
  // Determine field state based on 'endusernew', which is the only thing relevant as this is replacing new ticket forms from the portal
  let fieldState;
  switch (field.endusernew) {
    case 0:
      fieldState = 'hidden';
      break;
    case 1:
      fieldState = 'editable';
      break;
    case 2:
      fieldState = 'warn';
      break;
    case 3:
      fieldState = 'required';
      break;
    case 4:
      fieldState = 'readonly';
      break;
    default:
      fieldState = 'editable'; // Default state if undefined
  }
  
  if (field.fieldinfo) {
    if (field.fieldinfo.type === 2 && field.fieldinfo.inputtype === 0) {
      return createDropdown(field, fieldState);
    } else if (field.fieldinfo.type === 2 && field.fieldinfo.inputtype === 1) {
      return createRadioButtons(field, fieldState);
    } else if (field.fieldinfo.type === 2 && field.fieldinfo.inputtype === 2) {
      return createRadioButtons(field, fieldState);
    } else if (field.fieldinfo.type === 10) {
      // need to generate a rich text input
    } else {
      return createTextInput(field, fieldState);
    } 
  }
}

function createDropdown(field, state) {
  if (state === 'hidden') {
    return null; // Do not render anything if field is hidden
  }

  const container = document.createElement('div');
  container.setAttribute('data-name', field.fieldinfo.name);
  container.className = 'form-group';
  
  const label = document.createElement('label');
  label.textContent = field.override_fieldname || field.fieldinfo.label;
  container.appendChild(label);

  const select = document.createElement('select');
  select.id = `field-${field.fieldinfo.id}`;
  const blankOption = document.createElement('option');
  blankOption.value = 0;
  blankOption.textContent = '-- PLEASE SELECT --';
  select.appendChild(blankOption);
  
  field.fieldinfo.values.forEach(value => {
    const option = document.createElement('option');
    option.value = value.id;
    option.textContent = value.name;
    if (field.visibility_conditions_value && field.visibility_conditions_value.length > 0)  option.style.display = 'none';
    select.appendChild(option);
  });
  container.appendChild(select);
  return container;
}

function createRadioButtons(field, state) {
  if (state === 'hidden') {
    return null; // Do not render anything if field is hidden
  }

  const fieldSet = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = field.override_fieldname || field.fieldinfo.label;
  fieldSet.id = `field-${field.fieldinfo.id}`;
  fieldSet.setAttribute('data-name', field.fieldinfo.name);
  fieldSet.appendChild(legend);

  field.fieldinfo.values.forEach(value => {
    const input = document.createElement('input');
    input.type = 'radio';
    input.id = `field_${field.fieldinfo.name}_${value.id}`;
    input.name = field.fieldinfo.name;
    input.value = value.name;
    const label = document.createElement('label');
    label.textContent = value.name;
    label.setAttribute('for', input.id);
    label.appendChild(input);
    fieldSet.appendChild(label);
  });
  
  return fieldSet;
}

function createTextInput(field, state) {
  if (state === 'hidden') {return null };
  
  const container = document.createElement('div');
  container.className = 'form-group';
  container.setAttribute('data-name', field.fieldinfo.name);
  
  if (state !== 'readonly') {
    // If read-only, hide the input field but display the hint
    const label = document.createElement('label');
    label.textContent = field.fieldinfo.label;
    container.appendChild(label);
  
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'form-control';
    input.id = `field-${field.fieldinfo.id}`;
    input.readOnly = (state === 'readonly');
    input.required = (state === 'required');
    container.appendChild(input);
  }

  // Check for hint and add it below the input field
  if (field.fieldinfo.hint) {
    const hint = document.createElement('div');
    hint.innerHTML = field.fieldinfo.hint;
    container.appendChild(hint);
  }
  return container
}

/**
 * Toggles the visibility of a field based on its field name and condition.
 * @param {string} fieldName - The name of the field (data-name attribute).
 * @param {boolean} isVisible - Whether the field should be shown or hidden.
 */
function toggleFieldVisibility(field, isVisible) {
  let fieldContainer, fieldName; 
  if (field.group) {
    console.log(`Toggling DFV Visibility for Group ${field.groupid} to Visible: ${isVisible}`);
    fieldContainer = document.querySelector(`[data-groupid="${field.groupid}"]`);
    const fieldName = field.groupid
  }
  else {
    console.log(`Toggling DFV Visibility for Field ${field.fieldinfo.name} to Visible: ${isVisible}`);
    fieldContainer = document.querySelector(`[data-name="${field.fieldinfo.name}"]`);
    fieldName = field.fieldinfo.name
  }
  
  if (fieldContainer) {
    fieldContainer.style.display = isVisible ? 'block' : 'none';
  } else {
    console.warn(`Field container with data-name="${fieldName}" not found`);
  }
}

/**
 * Gets the value of a lookup field based on its type.
 * @param {HTMLElement} lookupField - The DOM element of the lookup field.
 * @returns {string|null} - The field's value, or null if it cannot be determined.
 */
function getFieldValue(lookupField) {
  if (!lookupField) return null; // Field not found

  // Handle by tagName and type
  switch (lookupField.tagName) {
    case 'INPUT':
      if (lookupField.type === 'radio') {
        const selectedRadio = document.querySelector(
          `#${lookupField.id} input:checked`
        );
        return selectedRadio ? selectedRadio.value : null;
      } else if (lookupField.type === 'checkbox') {
        return lookupField.checked ? 'true' : 'false';
      } else {
        return lookupField.value; // Default for text inputs
      }

    case 'SELECT':
        return lookupField.value > 0 ? lookupField.value : null;
    
    case 'FIELDSET':
      const selectedRadio = lookupField.querySelector('input:checked'); // Radio buttons in a fieldset
      return selectedRadio ? selectedRadio.value : null;

    case 'TEXTAREA':
      return lookupField.value; // Textareas

    default:
      console.warn(`Unsupported field type: ${lookupField.tagName}`);
      return null;
  }
}

/**
 * Evaluates the visibility conditions for a field.
 * @param {Array} conditions - Array of visibility conditions for the field.
 * @param {object} field - The field object being evaluated (to get the field name).
 */
function evaluateAndToggleVisibility(conditions, field, type) {
  if (type === 'value') {
    const selectField = document.querySelector(`#field-${field.fieldinfo.id}`);
    if (!selectField) {
      console.warn(`Lookup field with ID "${field.fieldinfo.id}" not found`);
      return;
    }

    const shouldShow = conditions.filter(condition => {
      const lookupField = document.querySelector(`#field-${condition.lookup_field_id}`);
      if (!lookupField) {
        console.warn(`Lookup field with ID "${condition.lookup_field_id}" not found`);
        return;
      }
      
      const lookupValue = getFieldValue(lookupField);
      
      switch (condition.conditiontype) {
        case 0: // Equals to
          console.log('matched equals');
          return lookupValue === condition.lookup_value_id.toString();
        case 1: // Empty
          console.log('matched empty');
          return lookupValue === '' || lookupValue === null;
        case 2: // Not empty
          console.log('matched not empty');
          return lookupValue !== '' && lookupValue !== null;
        case 3: // Is not equals to
          console.log('matched is not equals');
          return lookupValue !== condition.lookup_value_id.toString();
        default:
          console.warn(`Unknown condition type: ${condition.conditiontype}`);
          return false;
      }
    }).map(condition => condition.field_value); // Get list of valid option values

    Array.from(selectField.options).forEach(option => {
      if (shouldShow.includes(parseInt(option.value))) {
        option.style.display = 'block'; // Show matching option
      } else {
        option.style.display = 'none'; // Hide non-matching option
      }
    });

  } else {
  if (!conditions || conditions.length === 0) return null; // No conditions, nothing to evaluate

  // Iterate through each condition
  const shouldHide = conditions.some(condition => {
    const lookupField = document.querySelector(`#field-${condition.lookup_field_id}`);

    if (!lookupField) {
      console.warn(`Lookup field with ID "${condition.lookup_field_id}" not found`);
      return true; // Fail the condition if the field is missing
    }

    const lookupValue = getFieldValue(lookupField);

    switch (condition.conditiontype) {
      case 0: // Equals to
        return lookupValue !== condition.lookup_value;
      case 1: // Empty
        return (lookupValue !== '' && lookupValue !== null);
      case 2: // Not empty
        return (lookupValue === '' || lookupValue === null);
      case 3: // Is not equals to
        return lookupValue === condition.lookup_value;
      default:
        console.warn(`Unknown condition type: ${condition.conditiontype}`);
        return true; // Fail the condition for unsupported types
    }
  });

  // Toggle visibility only if a condition fails
  if (shouldHide) {
    toggleFieldVisibility(field, false); // Hide the field
  } else {
    toggleFieldVisibility(field, true); // Show the field
    }
  }
}

function initializeVisibility() {
  formFields.forEach(field => {
    if (field.group) {
      if (field.group.visibility_conditions && field.group.visibility_conditions.length > 0) {
      evaluateAndToggleVisibility(field.group.visibility_conditions, field, 'field');
      }
    }
    else {
        if (field.visibility_conditions && field.visibility_conditions.length > 0) {
          evaluateAndToggleVisibility(field.visibility_conditions, field, 'field');
          if (field.visibility_conditions_value && field.visibility_conditions_value.length > 0) {
            evaluateAndToggleVisibility(field.visibility_conditions_value, field, 'value');
          }
        }
    }
  });
}

function renderForm(fields) {
  const formContainer = document.getElementById('formContainer');
  formContainer.innerHTML = ''; // Clear existing form

  fields.forEach(field => {
    if (field.group) {
      // Create a header for the group and handle grouped fields
      const groupContainer = document.createElement('div');
      groupContainer.setAttribute('data-groupid', field.groupid);
      const groupHeader = document.createElement('h3');
      groupHeader.textContent = field.group.header;
      groupContainer.appendChild(groupHeader);


      field.group.fields.forEach(subField => {
        const element = handleField(subField); // Handle each sub-field in the group
        if (element) groupContainer.appendChild(element);
      });

      formContainer.appendChild(groupContainer);
    } else {
      const element = handleField(field);
      if (element) formContainer.appendChild(element);
    }
  });

  formContainer.addEventListener('change', () => {
    initializeVisibility();
  });
}
