const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const PRODUCTS_FILE = path.join(__dirname, 'public', 'data', 'ReturnsProducts.json');

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint to add products
app.post("/api/products", (req, res) => {
    const newProduct = req.body;
    console.log("New product received:", newProduct);

    // Basic validation to ensure required fields are present
    if (!newProduct.productId || !newProduct.productDescription || !newProduct.productCategory ||
        !newProduct.productUOM || newProduct.productPrice === undefined) {
        return res.status(400).json({ message: "Product ID, Description, Category, Unit of Measure, and Price are required." });
    }

    fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
        let products = [];
        if (!err) {
            try {
                products = JSON.parse(data);
            } catch (parseErr) {
                console.error("Error parsing existing products JSON:", parseErr);
                return res.status(500).json({ message: "Error reading product data." });
            }
        } else if (err.code !== 'ENOENT') { // 'ENOENT' means file not found
            console.error("Error reading products file:", err);
            return res.status(500).json({ message: "Error accessing product data file." });
        }

        // Check for duplicate product ID before adding
        if (products.some(p => p.productId === newProduct.productId)) {
            return res.status(409).json({ message: "Product with this ID already exists." });
        }

        products.push(newProduct); // Add the new product to the array

        // Write the updated array back to the JSON file
        fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8', (writeErr) => {
            if (writeErr) {
                console.error("Error writing product to file:", writeErr);
                return res.status(500).json({ message: "Error saving product data." });
            }
            console.log("Product saved successfully:", newProduct.productId);
            res.status(201).json({ message: "Product added successfully", product: newProduct });
        });
    });
});

// API endpoint to retrieve all products
app.get("/api/products", (req, res) => {
    fs.readFile(PRODUCTS_FILE, 'utf8', (err, data) => {
        if (err) {
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            console.error("Error reading products file:", err);
            return res.status(500).json({ message: "Error accessing product data file." });
        }

        try {
            const products = JSON.parse(data);
            res.json(products);
        } catch (parseErr) {
            console.error("Error parsing products JSON:", parseErr);
            res.status(500).json({ message: "Error parsing product data." });
        }
    });
});

// API endpoint to process returns
app.post("/api/processReturn", (req, res) => {
    const returnData = req.body;
    console.log("Return request received:", returnData);
    res.json({
        status: "success",
        refundID: returnData.refundId,
        refundAmount: returnData.refundAmount,
        refundDate: returnData.refundDate,
        confirmationID: "RefundID" + Math.floor(Math.random() * 100000)
    });
});

// Starts the server and listens for incoming requests.
app.listen(PORT, () => {
    console.log(`Return processing`);
});
