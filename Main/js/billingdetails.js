var app = angular.module('storefrontApp', []);

app.controller('BillingReturnController', ['$scope', '$http', function($scope, $http) {
  $scope.ui = { loading: false, error: '' };
  $scope.form = {
    shopperId: '',
    reason: '',
    refundMethod: '',
    cardNumber: '',
    expiry: '',
    cvc: '',
    returnType: ''
  };
  $scope.refundDetails = {};
  $scope.returnCart = [];


  // Simple card checks (for demo only)
  function luhnCheck(num) {
    const s = (num || '').replace(/\D/g, '');
    let sum = 0, dbl = false;
    for (let i = s.length - 1; i >= 0; i--) {
      let d = parseInt(s[i], 10);
      if (dbl) { d *= 2; if (d > 9) d -= 9; }
      sum += d; dbl = !dbl;
    }
    return s.length >= 12 && sum % 10 === 0;
  }

  function parseExpiry(mmYY) {
    const m = (mmYY || '').match(/^(\d{2})\/(\d{2})$/);
    if (!m) return null;
    const mm = parseInt(m[1], 10), yy = parseInt(m[2], 10);
    const year = 2000 + yy, monthIdx = mm - 1;
    const now = new Date();
    const exp = new Date(year, monthIdx + 1, 0);
    return { valid: exp >= now };
  }

  $scope.submitReturn = function() {
    $scope.ui.error = '';

    // Basic validation
    if (!$scope.form.shopperId || !$scope.form.reason || !$scope.form.refundMethod || !$scope.form.returnType) {
      $scope.ui.error = 'Please fill all required fields.';
      return;
    }
    if ($scope.form.refundMethod === 'original_card') {
      if (!luhnCheck($scope.form.cardNumber)) {
        $scope.ui.error = 'Invalid card number.';
        return;
      }
      const exp = parseExpiry($scope.form.expiry);
      if (!exp || !exp.valid) {
        $scope.ui.error = 'Card expiry invalid or expired.';
        return;
      }
      if (!/^\d{3,4}$/.test($scope.form.cvc)) {
        $scope.ui.error = 'Invalid CVC.';
        return;
      }
    }

    // Build the billing JSON doc
    const payload = {
      shopperId: $scope.form.shopperId,
      reason: $scope.form.reason,
      refundMethod: $scope.form.refundMethod,
      returnType: $scope.form.returnType,
      items: $scope.returnCart.map(item => ({
        id: item.id,
        productName: item.productName,
        originalPrice: item.originalPrice,
        quantity: item.quantity || 1
      })),
      billing: {
        last4: $scope.form.cardNumber
          ? $scope.form.cardNumber.replace(/\D/g, '').slice(-4)
          : null,
        expiry: $scope.form.expiry || null
      },
      submittedAt: new Date().toISOString()
    };

    // Send to backend
    $scope.ui.loading = true;
    $http.post('/api/billing', payload)
      .then(function(res) {
        $scope.refundDetails = {
          status: 'ok',
          confirmationID: res.data.confirmationID || ('BILL-' + Math.random().toString(36).substr(2,6).toUpperCase())
        };
      })
      .catch(function(err) {
        console.error(err);
        $scope.ui.error = 'Error submitting billing details.';
      })
      .finally(function() {
        $scope.ui.loading = false;
      });
  };
}]);
(function() {
  var timer = null;

  function renderResults(products) {
    var $results = $('#productResults').empty();
    if (!products.length) {
      $results.html('<p class="text-muted">No products found.</p>');
      return;
    }
    products.forEach(function(p) {
      var card = `
        <div class="card p-2 mb-2">
          <h5>${p.name}</h5>
          <p>$${(p.price || 0).toFixed(2)}</p>
          <button class="btn btn-sm btn-outline-primary add-return"
                  data-id="${p.id}"
                  data-name="${p.name}"
                  data-price="${p.price || 0}">Add to Return</button>
        </div>`;
      $results.append(card);
    });
  }

  $('#searchBox').on('input', function() {
    var q = $(this).val().trim();
    clearTimeout(timer);
    timer = setTimeout(function() {
      if (!q) return $('#productResults').empty();
      $.getJSON('/api/products', { query: q })
        .done(renderResults)
        .fail(() => $('#productResults').html('<p class="text-danger">Error searching.</p>'));
    }, 250);
  });

  $('#productResults').on('click', '.add-return', function() {
    var prod = {
      id: $(this).data('id'),
      name: $(this).data('name'),
      price: $(this).data('price')
    };
    var scope = angular.element(document.body).scope();
    scope.$apply(() => scope.addItemToReturn(prod));
  });
})();
