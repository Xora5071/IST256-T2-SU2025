document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    const successMessage = document.getElementById('successMessage');

    productForm.addEventListener('submit', function(event) {
        // Prevent the default form submission behavior
        event.preventDefault();

        // Collect all form data
        const formData = new FormData(productForm);
        const productData = Object.fromEntries(formData.entries());

        // Log the collected data to the console for verification
        console.log("Product Data:", productData);

        // Here is where you would typically send the data to a server
        // using an API call, for example, with the 'fetch' API.
        // fetch('your-api-endpoint', {
        //     method: 'POST',
        //     body: JSON.stringify(productData),
        //     headers: {
        //         'Content-Type': 'application/json'
        //     }
        // })
        // .then(response => response.json())
        // .then(data => {
        //     console.log('Success:', data);
        //     // Handle success here (e.g., show a success message)
        // })
        // .catch((error) => {
        //     console.error('Error:', error);
        //     // Handle errors here
        // });

        // For this example, we will just simulate a successful submission:

        // Show the success message
        successMessage.style.display = 'block';

        // Clear all form fields after a small delay
        setTimeout(() => {
            productForm.reset();
            successMessage.style.display = 'none';
        }, 3000); // Hide the message after 3 seconds
    });
});