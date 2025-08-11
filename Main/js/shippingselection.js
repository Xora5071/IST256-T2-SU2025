// AngularJS application logic for the storefront shipping form.
angular.module('storefrontApp', [])
.controller('ShippingController', function($scope) {

    // Bindable model
    $scope.shippingDetails = {
        street1: '',
        street2: '',
        city: '',
        state: '',
        zip: '',
        carrier: '',
        method: ''
    };

    // Handle form submission
    $scope.submitShipping = function() {
        if ($scope.shippingForm.$valid) {

            // Save to localStorage so shoppingcart.js can pick it up
            localStorage.setItem('shippingDetails', JSON.stringify($scope.shippingDetails));

            // Optionally POST to your REST API right now
            $http.post('/api/shipping', $scope.shippingDetails)
                .then(function(response) {
                    console.log('Shipping info saved to server:', response.data);

                    // Redirect to cart after successful POST
                    window.location.href = 'shoppingcart.html';
                })
                .catch(function(error) {
                    console.error('Error saving shipping info:', error);
                    alert('There was an issue saving your shipping info.');
                });

        } else {
            alert('Please complete all required fields before continuing.');
        }
    };
}]);
