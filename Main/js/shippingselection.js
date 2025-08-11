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

    // Handles form submission, validates input, and saves data
    $scope.submitShipping = function() {
        if ($scope.shippingForm && $scope.shippingForm.$valid) {

            // Store the details for the cart page to use later
            localStorage.setItem(
                'shippingDetails',
                JSON.stringify($scope.shippingDetails)
            );

            console.log('Shipping details submitted:', $scope.shippingDetails);
            alert('Shipping information confirmed!');

            // Redirect to cart page or next checkout step
            window.location.href = 'shoppingcart.html';
        } else {
            alert('Please fill out all required fields correctly.');
        }
    };
});
