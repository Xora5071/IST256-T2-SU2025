// Helper: render Bootstrap alert messages
function showMessage(type, text) {
  // type: 'success' | 'danger' | 'warning' | 'info'
  const messageArea = document.getElementById('formMessage') || (() => {
    const m = document.createElement('div');
    m.id = 'formMessage';
    document.getElementById('shopperForm').insertAdjacentElement('afterend', m);
    return m;
  })();

  messageArea.innerHTML = `
    <div class="alert alert-${type} alert-dismissible fade show" role="alert">
      ${text}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
}

// Basic email and phone validators
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRegex = /^\+?[0-9\s\-().]{7,20}$/; // permissive, optional

// Endpoints (adjust to your server)
const ENDPOINTS = {
  create: '/add-shopper',                 // your current route (POST)
  getOne: (email) => `/api/shoppers/${encodeURIComponent(email)}`, // optional GET for prefill
  update: (email) => `/api/shoppers/${encodeURIComponent(email)}`  // PUT for updates
};

// This function handles the form submission
async function submitShopperForm() {
  const form = document.getElementById('shopperForm');
  const submitBtn = document.getElementById('submitBtn');

  // Gather and trim
  const formData = {
    email: form.email.value.trim(),
    name: form.name.value.trim(),
    phone: form.phone.value.trim(),
    age: Number(form.age.value),
    address: form.address.value.trim()
  };

  // Client-side validation
  const errors = [];
  if (!formData.email || !emailRegex.test(formData.email)) errors.push('A valid email is required.');
  if (!formData.name) errors.push('Name is required.');
  if (!Number.isFinite(formData.age) || formData.age < 0 || formData.age > 130) errors.push('Enter a valid age (0–130).');
  if (!formData.address) errors.push('Address is required.');
  if (formData.phone && !phoneRegex.test(formData.phone)) errors.push('Phone format looks invalid.');

  if (errors.length) {
    showMessage('danger', errors.join('<br>'));
    return;
  }

  // Disable button to prevent double-submit
  const originalBtnText = submitBtn ? submitBtn.textContent : null;
  if (submitBtn) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';
  }

  try {
    // Try to create first (your existing route)
    const createRes = await fetch(ENDPOINTS.create, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    if (createRes.ok) {
      const result = await safeParseJSON(createRes);
      const idText = result?.insertedId ? ` ID: ${result.insertedId}` : '';
      showMessage('success', `Shopper added successfully!${idText}`);
      form.reset();
      return;
    }

    // If duplicate, ask to update
    if (createRes.status === 409) {
      const proceed = confirm('A shopper with this email already exists. Update their details instead?');
      if (!proceed) {
        const errData = await safeParseJSON(createRes);
        showMessage('warning', errData?.message || 'Shopper already exists. No changes made.');
        return;
      }

      // PUT update by email (RESTful)
      const updateRes = await fetch(ENDPOINTS.update(formData.email), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (updateRes.ok) {
        const upd = await safeParseJSON(updateRes);
        const changed = (upd?.modifiedCount ?? upd?.upsertedCount ?? upd?.matchedCount) || 1;
        showMessage('success', `Shopper updated successfully. (${changed} record affected)`);
        form.reset();
        return;
      } else {
        const err = await safeParseJSON(updateRes);
        showMessage('danger', err?.message || 'Failed to update shopper.');
        return;
      }
    }

    // Other server-side error
    const errorData = await safeParseJSON(createRes);
    showMessage('danger', errorData?.message || 'Failed to add shopper.');

  } catch (err) {
    console.error('Network error:', err);
    showMessage('danger', 'A network error occurred. Please try again.');
  } finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
    }
  }
}

// Safe JSON parse helper
async function safeParseJSON(res) {
  const text = await res.text();
  try { return text ? JSON.parse(text) : null; } catch { return null; }
}

/* Optional: Prefill form by email (e.g., from a search field)
async function loadShopperByEmail(email) {
  if (!email) return;
  try {
    const res = await fetch(ENDPOINTS.getOne(email));
    if (!res.ok) {
      showMessage('warning', 'No shopper found for that email.');
      return;
    }
    const shopper = await res.json();
    const form = document.getElementById('shopperForm');
    form.email.value = shopper.email || '';
    form.name.value = shopper.name || '';
    form.phone.value = shopper.phone || '';
    form.age.value = Number.isFinite(shopper.age) ? shopper.age : '';
    form.address.value = shopper.address || '';
    showMessage('info', 'Loaded shopper into the form. You can update and save.');
  } catch (e) {
    showMessage('danger', 'Could not load shopper.');
  }
}
*/
