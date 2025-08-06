$(document).ready(function() {

    // URL to the API endpoint on the server.
    const jsonUrl = "/api/products";
    // Global variables for the shopping cart and product data
    let cart = [];
    let products = [];
    let cartVisible = false;

    // Cache DOM elements for efficiency
    const productList = $("#product-list");
    const cartItemsList = $("#cart-items");
    const cartTotalSpan = $("#cart-total");
    const cartCountSpan = $("#cart-count");
    const cartSidebar = $("#cart-sidebar");
    const cartToggleButton = $("#cart-toggle");
    const checkoutButton = $("#checkout");

    // Fetch products from the specified URL using AJAX
    $.ajax({
        url: jsonUrl,
        method: "GET",
        dataType: "json",
        success: function(data) {
            products = data;
            renderProducts();
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.error("Error fetching products:", textStatus, errorThrown);
            productList.html("<p>Error loading products. Please check the network and try again.</p>");
        }
    });

    // Render all products on the page
    function renderProducts() {
        productList.empty();
        products.forEach(product => {
            const productCard = `
                <div class="col-md-4 mb-4">
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${product.name}</h5>
                            <p class="card-text">$${product.price.toFixed(2)}</p>
                            <button class="btn btn-success add-to-cart-btn" data-product-id="${product.id}">Add to Cart</button>
                        </div>
                    </div>
                </div>
            `;
            productList.append(productCard);
        });

        productList.on("click", ".add-to-cart-btn", function() {
            const productId = $(this).data("product-id");
            addItemToCart(productId);
        });
    }

    // Add an item to the cart
    function addItemToCart(productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
            const existingItem = cart.find(item => item.id === productId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: 1
                });
            }
            updateCartDisplay();
        }
    }

    // Update the cart's HTML display
    function updateCartDisplay() {
        cartItemsList.empty();
        let total = 0;

        if (cart.length === 0) {
            cartItemsList.append("<li class='list-group-item'>Your cart is empty.</li>");
        } else {
            cart.forEach(item => {
                const itemTotal = item.price * item.quantity;
                total += itemTotal;
                const cartItem = `
                    <li class="list-group-item d-flex justify-content-between align-items-center">
                        ${item.name} (${item.quantity})
                        <span>$${itemTotal.toFixed(2)}</span>
                    </li>
                `;
                cartItemsList.append(cartItem);
            });
        }

        cartCountSpan.text(cart.length);
        cartTotalSpan.text(total.toFixed(2));
    }

    // Handle cart sidebar toggle
    cartToggleButton.on("click", function() {
        cartSidebar.toggleClass("open");
});

    // Handle checkout button click
    checkoutButton.on("click", function() {
        if (cart.length > 0) {
         alert(`Checking out with a total of $${cartTotalSpan.text()}`);
            cart = [];
            updateCartDisplay();
            cartSidebar.removeClass("open");
        } else {
            alert("Your cart is empty!");
        }
});

    updateCartDisplay();
});