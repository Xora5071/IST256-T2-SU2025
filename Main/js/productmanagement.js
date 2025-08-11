document.addEventListener('DOMContentLoaded', function() {
    const productForm = document.getElementById('productForm');
    const successMessage = document.getElementById('successMessage');

    // Handles form submission.
    productForm.addEventListener('submit', function(event) {
        event.preventDefault();

        // Collects form data.
        const formData = new FormData(productForm);
        const productData = Object.fromEntries(formData.entries());

        console.log("Product Data:", productData);

        // --- API Fetch Section ---
        fetch('/api/products', {
            method: 'POST',
            body: JSON.stringify(productData),
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
            if (successMessage) {
                successMessage.textContent = 'Product data submitted successfully!';
                successMessage.style.display = 'block';
            } else {
                alert('Product data submitted successfully!');
            }

            // Clear form fields and hide message after a delay.
            setTimeout(() => {
                productForm.reset();
                if (successMessage) {
                    successMessage.style.display = 'none';
                }
            }, 3000);
        })
        .catch((error) => {
            console.error('Error:', error);
            alert('There was a problem submitting the product data! Please try again.');
        });
    });
});