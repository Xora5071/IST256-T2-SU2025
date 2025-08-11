document.addEventListener('DOMContentLoaded', function () {
  const productForm = document.getElementById('productForm');
  const successMessage = document.getElementById('successMessage');

  // Field refs
  const fields = {
    productId: document.getElementById('productId'),
    description: document.getElementById('productDescription'),
    category: document.getElementById('productCategory'),
    color: document.getElementById('productColor'),
    condition: document.getElementById('productCondition'),
    price: document.getElementById('productPrice'),
    image: document.getElementById('productImage')
  };

  // Helpers for validation UI
  function setError(el, msg) {
    el.classList.add('is-invalid');
    let fb = el.nextElementSibling;
    if (!fb || !fb.classList.contains('invalid-feedback')) {
      fb = document.createElement('div');
      fb.className = 'invalid-feedback';
      el.insertAdjacentElement('afterend', fb);
    }
    fb.textContent = msg;
  }
  function clearError(el) {
    el.classList.remove('is-invalid');
  }
  function showSuccess(msg) {
    if (!successMessage) {
      alert(msg);
      return;
    }
    successMessage.textContent = msg;
    // Support both Bootstrap alert (d-none) or plain element with display: none
    if (successMessage.classList.contains('d-none')) {
      successMessage.classList.remove('d-none');
    } else {
      successMessage.style.display = 'block';
    }
  }
  function hideSuccess() {
    if (!successMessage) return;
    if (successMessage.classList.contains('d-none')) return;
    if (successMessage.style.display === 'block') {
      successMessage.style.display = 'none';
    } else {
      successMessage.classList.add('d-none');
    }
  }

  // Inline clear error on change/input
  Object.values(fields).forEach(el => {
    const evt = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(evt, () => clearError(el));
  });

  // Validation
  function validate() {
    let ok = true;

    // Product ID: required, 2–20 chars, letters/numbers/-/_
    const id = fields.productId.value.trim();
    clearError(fields.productId);
    if (!id) { setError(fields.productId, 'Product ID is required.'); ok = false; }
    else if (!/^[A-Za-z0-9-_]{2,20}$/.test(id)) { setError(fields.productId, 'Use 2–20 letters, numbers, - or _.'); ok = false; }

    // Description
    const desc = fields.description.value.trim();
    clearError(fields.description);
    if (!desc) { setError(fields.description, 'Description is required.'); ok = false; }
    else if (desc.length < 5) { setError(fields.description, 'Please provide at least 5 characters.'); ok = false; }

    // Category, Color, Condition
    ['category','color','condition'].forEach(k => {
      clearError(fields[k]);
      if (!fields[k].value) {
        setError(fields[k], `Please select a ${k}.`);
        ok = false;
      }
    });

    // Price >= 0.01
    const priceNum = parseFloat(fields.price.value);
    clearError(fields.price);
    if (Number.isNaN(priceNum)) { setError(fields.price, 'Price is required.'); ok = false; }
    else if (priceNum < 0.01) { setError(fields.price, 'Price must be at least 0.01.'); ok = false; }

    // Image file presence + basic type/size checks
    clearError(fields.image);
    const file = fields.image.files[0];
    if (!file) { setError(fields.image, 'Image is required.'); ok = false; }
    else {
      const okTypes = ['image/jpeg','image/png','image/webp','image/gif'];
      if (!okTypes.includes(file.type)) { setError(fields.image, 'Use JPG, PNG, WEBP, or GIF.'); ok = false; }
      if (file.size > 5 * 1024 * 1024) { setError(fields.image, 'Max size is 5MB.'); ok = false; }
    }

    return { ok, id, desc, priceNum, file };
  }

  // Handles form submission.
  productForm.addEventListener('submit', async function (event) {
    event.preventDefault();
    hideSuccess();

    // Validate fields
    const { ok, id, desc, priceNum, file } = validate();
    if (!ok) return;

    // Collect raw form data (for logging/debug)
    const formData = new FormData(productForm);
    const productDataRaw = Object.fromEntries(formData.entries());
    console.log('Product Data (raw FormData):', productDataRaw);

    // Build normalized JSON payload
    // Includes both your original names and normalized names to ease backend mapping
    const payload = {
      // normalized
      productId: id,
      description: desc,
      category: fields.category.value,
      color: fields.color.value,
      condition: fields.condition.value,
      price: parseFloat(priceNum.toFixed(2)),
      imageName: file ? file.name : null,

      // original form keys (so existing backend contracts won’t break)
      productDescription: desc,
      productCategory: fields.category.value,
      productColor: fields.color.value,
      productCondition: fields.condition.value,
      productPrice: parseFloat(priceNum.toFixed(2)),
      productImageName: file ? file.name : null
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      console.log('Success:', data);

      showSuccess('Product data submitted successfully!');

      // Reset
      productForm.reset();
      Object.values(fields).forEach(el => el.classList.remove('is-invalid'));
      setTimeout(hideSuccess, 3000);
    } catch (error) {
      console.error('Error:', error);
      alert('There was a problem submitting the product data! Please try again.');
    }
  });
});
