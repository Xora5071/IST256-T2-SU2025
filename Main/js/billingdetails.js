$(document).ready(function(){
    let returnProducts = [];

    // Fetches product data from a JSON file.
    $.getJSON("data/ReturnsProducts.json", function(data) {
        returnProducts = data;
        displayProducts(returnProducts);
    }).fail(function(jqxhr, textStatus, error) {
        console.error("Error loading ReturnsProducts.json: " + textStatus + ", " + error);
    });

    // Handles real-time search as the user types.
    $("#searchBox").on("input", function(){
        const query = $(this).val().toLowerCase();
        const filtered = returnProducts.filter(p =>
            p.productName.toLowerCase().includes(query) ||
            p.productId.toLowerCase().includes(query)
        );
        displayProducts(filtered);
    });

    // Displays products in the results div.
    function displayProducts(products) {
        $("#productResults").empty();
        if (products.length === 0) {
            $("#productResults").append('<p class="text-gray-500 text-center py-4">No products found.</p>');
            return;
        }
        products.forEach(p => {
            $("#productResults").append(
                `<div class="product-item">
                    <span>${p.productName} ($${p.originalPrice.toFixed(2)})</span>
                    <button class="btn btn-primary addToCart" data-id="${p.productId}">Add to Return Cart</button>
                </div>`
            );
        });
    }

    // Handles click event for "Add to Return Cart" buttons.
    $(document).on("click", ".addToCart", function(){
        const productId = $(this).data("id");
        alert("Added product ID " + productId + " to return cart!");
        // In a real application, you might integrate this with your AngularJS returnCart.
    });
});

var app = angular.module("storefrontApp", []);
app.controller("BillingReturnController", function($scope, $http){
    $scope.returnCart = [];
    $scope.refundDetails = {};
    $scope.shopperId = "";
    $scope.reason = "";
    $scope.submitReturn = function() {
        const returnData = {
            shopperId: $scope.shopperId,
            refundId: "R12345",
            refundAmount: 25.00,
            refundDate: new Date().toISOString(),
            reasonForRefund: $scope.reason,
            refundItems: $scope.returnCart,
            refundLocation: {
                type: "creditCard",
                creditCardLastFour: "1234"
            }
        };
        $http.post("/api/processReturn", returnData)
        .then(function(response){
            $scope.refundDetails = response.data;
            alert("Return processed successfully!");
        }, function(error){
            alert("Error processing return: " + error.statusText);
        });
    };
});