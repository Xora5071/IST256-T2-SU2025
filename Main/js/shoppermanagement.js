// This function handles the form submission
async function submitShopperForm() {
    // Get the form element and a place to display messages
    const form = document.getElementById('shopperForm');
    let messageArea = document.getElementById('formMessage'); // We'll add this to the HTML

    // Create a simple message area if one doesn't exist
    if (!messageArea) {
        messageArea = document.createElement('div');
        messageArea.id = 'formMessage';
        form.parentNode.insertBefore(messageArea, form.nextSibling);
    }

    // Reset message area
    messageArea.textContent = '';
    messageArea.className = '';

    // Create an object from the form data
    const formData = {
        email: form.email.value,
        name: form.name.value,
        phone: form.phone.value,
        age: Number(form.age.value),
        address: form.address.value
    };

    // Simple validation
    if (!formData.email || !formData.name || !formData.age || !formData.address) {
        messageArea.textContent = 'Please fill out all required fields.';
        messageArea.className = 'error';
        return;
    }

    // --- Send the data to your Node.js server ---
    try {
        const response = await fetch('/add-shopper', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        // Check if the request was successful
        if (response.ok) {
            const result = await response.json();
            messageArea.textContent = `Shopper added successfully! ID: ${result.insertedId}`;
            messageArea.className = 'success';
            form.reset(); // Clear the form
        } else {
            // Handle server-side errors
            const errorData = await response.json();
            messageArea.textContent = `Error: ${errorData.message || 'Failed to add shopper.'}`;
            messageArea.className = 'error';
        }
    } catch (error) {
        // Handle network or other fetch errors
        console.error('Fetch error:', error);
        messageArea.textContent = 'A network error occurred. Please try again.';
        messageArea.className = 'error';
    }
}