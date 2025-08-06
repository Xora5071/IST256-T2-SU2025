// AngularJS application logic for the storefront shipping form.

angular.module('storefrontApp', [])
    .controller('ShippingController', function($scope) {
        $scope.shippingDetails = {
            street1: '',
            street2: '',
            city: '',
            state: '',
            zip: '',
            carrier: '',
            method: ''
        };

        // Handles form submission, validates input, and logs data.
        $scope.submitShipping = function() {
            if ($scope.shippingForm && $scope.shippingForm.$valid) {
                console.log('Shipping details submitted:', $scope.shippingDetails);
                alert('Shipping information confirmed!');
            } else {
                alert('Please fill out all fields.');
            }
        };
    });