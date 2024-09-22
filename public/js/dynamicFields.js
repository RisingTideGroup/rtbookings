// Define the API URL and fetch the fields
const apiUrl = `${baseUrl}/TicketType/${ticketTypeId}?published_id=${publishedId}`
let formFields = [];

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    formFields = data.fields;
    renderForm(formFields);
  });

function handleField(field) {
  console.log(`Doing Field ${field.fieldinfo.label} of ID ${field.fieldinfo.id}`);

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
      fieldState = 'required';
      break;
    case 3:
      fieldState = 'readonly';
      break;
    default:
      fieldState = 'editable'; // Default state if undefined
  }
  
  if (field.fieldinfo) {
    if (field.fieldinfo.type === 2 && field.fieldinfo.inputtype === 0) {
      createDropdown(field, fieldState);
    } else if (field.fieldinfo.type === 2 && field.fieldinfo.inputtype === 1) {
      createRadioButtons(field, fieldState);
    } else if (field.fieldinfo.type === 0) {
      createTextInput(field, fieldState);
    }
  }
}

function renderForm(fields) {
  const formContainer = document.getElementById('formContainer');
  formContainer.innerHTML = ''; // Clear existing form

  fields.forEach(field => {
    if (field.group) {
      // Create a header for the group and handle grouped fields
      const groupHeader = document.createElement('h3');
      groupHeader.textContent = field.group.header;
      formContainer.appendChild(groupHeader);

      field.group.fields.forEach(subField => {
        handleField(subField); // Handle each sub-field in the group
      });
    } else {
      handleField(field); // Handle regular fields
    }
  });
}


function createDropdown(field, state) {
  if (state === 'hidden') {
    return; // Do not render anything if field is hidden
  }

  const label = document.createElement('label');
  label.textContent = field.override_fieldname || field.fieldinfo.label;
  formContainer.appendChild(label);

  const select = document.createElement('select');
  field.fieldinfo.values.forEach(value => {
    const option = document.createElement('option');
    option.value = value.id;
    option.textContent = value.name;
    select.appendChild(option);
  });
  formContainer.appendChild(select);
}

function createRadioButtons(field, state) {
  if (state === 'hidden') {
    return; // Do not render anything if field is hidden
  }

  const fieldSet = document.createElement('fieldset');
  const legend = document.createElement('legend');
  legend.textContent = field.override_fieldname || field.fieldinfo.label;
  fieldSet.appendChild(legend);

  field.fieldinfo.values.forEach(value => {
    const input = document.createElement('input');
    input.type = 'radio';
    input.name = field.fieldinfo.name;
    input.value = value.id;
    const label = document.createElement('label');
    label.textContent = value.name;
    label.appendChild(input);
    fieldSet.appendChild(label);
  });
  formContainer.appendChild(fieldSet);
}

function createTextInput(field, state) {
  if (state === 'hidden') {
    return; // Do not render anything if field is hidden
  }

  const container = document.createElement('div');
  container.className = 'form-group';
  
  // Check if the field is read-only
  if (state === 'readonly') {
      // If read-only, hide the input field but display the hint
    if (field.fieldinfo.hint) {
      const hint = document.createElement('div');
      hint.innerHTML = field.fieldinfo.hint;
      container.appendChild(hint);
    }
  } 
  else {
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

    // Check for hint and add it below the input field
    if (field.fieldinfo.hint) {
      const hint = document.createElement('div');
      hint.innerHTML = field.fieldinfo.hint;  // Render HTML or plain text
      container.appendChild(hint);
    }
  }

  formContainer.appendChild(container);
}

// Add event listeners to handle visibility conditions based on selection
document.getElementById('formContainer').addEventListener('change', (event) => {
  const target = event.target;
  formFields.forEach(field => {
    if (field.visibility_conditions) {
      field.visibility_conditions.forEach(condition => {
        if (condition.lookup_field_id.toString() === target.name && target.value === condition.lookup_value) {
          document.querySelector(`[name="${field.fieldinfo.name}"]`).parentNode.style.display = 'block';
        } else {
          document.querySelector(`[name="${field.fieldinfo.name}"]`).parentNode.style.display = 'none';
        }
      });
    }
  });
});
