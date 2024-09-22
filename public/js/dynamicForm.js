document.addEventListener('DOMContentLoaded', function() {
    fetch(`${baseUrl}/TicketType/${ticketTypeId}?published_id=${publishedId}`)
        .then(response => response.json())
        .then(data => {
            buildForm(data);
        })
        .catch(error => console.error('Error fetching form data:', error));
});

function buildForm(data) {
    const container = document.getElementById('formContainer');
    container.innerHTML = ''; // Clear previous contents

    data.fields.forEach(field => {
        if (field.visible) {
            const label = document.createElement('label');
            label.textContent = field.fieldinfo.label;
            label.htmlFor = field.fieldinfo.name;

            let input;
            switch(field.fieldinfo.type) {
                case 2: // Assuming '2' is for select dropdown
                    input = document.createElement('select');
                    field.fieldinfo.values.forEach(optionData => {
                        const option = document.createElement('option');
                        option.value = optionData.id;
                        option.textContent = optionData.name;
                        input.appendChild(option);
                    });
                    break;
                default:
                    input = document.createElement('input');
                    input.type = 'text';
            }

            input.id = field.fieldinfo.name;
            input.name = field.fieldinfo.name;

            container.appendChild(label);
            container.appendChild(input);
        }
    });

    const submitButton = document.createElement('button');
    submitButton.textContent = 'Submit';
    submitButton.type = 'submit';
    container.appendChild(submitButton);

    submitButton.addEventListener('click', submitForm);
}

function submitForm() {
    const formElements = document.getElementById('formContainer').elements;
    const formData = {};
    for (let element of formElements) {
        if (element.name) {
            formData[element.name] = element.value;
        }
    }

    fetch(`${baseUrl}/api/TicketType/${ticketTypeId}/submit`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Ticket created:', data.ticketNumber);
        // Potentially redirect or perform additional actions here
    })
    .catch(error => console.error('Error submitting form:', error));
}
