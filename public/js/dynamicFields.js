// Define the API URL and fetch the fields
const apiUrl = `${baseUrl}/TicketType/${ticketTypeId}?published_id=${publishedId}`
let formFields = [];

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    formFields = data.fields;
    renderForm(formFields);
  });

function renderForm(fields) {
  const formContainer = document.getElementById('formContainer');
  formContainer.innerHTML = ''; // Clear existing form

  fields.forEach(field => {
    if (field.fieldinfo.type === 2 && field.fieldinfo.inputtype === 0) {
      // Dropdown
      createDropdown(field);
    } else if (field.fieldinfo.type === 2 && field.fieldinfo.inputtype === 1) {
      // Radio Buttons
      createRadioButtons(field);
    } else if (field.fieldinfo.type === 0) {
      // Text Input
      createTextInput(field);
    }
  });
}

function createDropdown(field) {
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

function createRadioButtons(field) {
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

function createTextInput(field) {
  const label = document.createElement('label');
  label.textContent = field.override_fieldname || field.fieldinfo.label;
  formContainer.appendChild(label);

  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = field.fieldinfo.hint;
  formContainer.appendChild(input);
}

// Add event listeners to handle visibility conditions based on selection
document.getElementById('dynamicForm').addEventListener('change', (event) => {
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
