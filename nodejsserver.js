require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Main'))); // Serves HTML/CSS/JS from /Main

// MongoDB setup
const mongoURL = "mongodb://localhost:27017/";
let db;

MongoClient.connect(mongoURL, { useUnifiedTopology: true })
  .then(client => {
    db = client.db("Db");
    console.log("Connected to MongoDB");

    // Insert sample document (optional)
    const customersCollection = db.collection("pract");
    const customer = { _id: 1, name: "John Doe", address: "123, City, State", orderdata: "Gameboy" };
    customersCollection.insertOne(customer).then(() => {
      console.log("1 document inserted");
    });
  })
  .catch(err => console.error("MongoDB connection error:", err));

/* ---------------------------
   API ROUTES
----------------------------*/

// Example existing route
app.get('/api/customers', async (req, res) => {
  const customers = await db.collection("pract").find().toArray();
  res.json(customers);
});

// Shopper info
app.post('/api/shopper', async (req, res) => {
  const result = await db.collection("shoppers").insertOne(req.body);
  res.json({ success: true, id: result.insertedId });
});

// Product list
app.get('/api/products', async (req, res) => {
  const products = await db.collection("products").find().toArray();
  res.json(products);
});

// Shopping cart
app.post('/api/cart', async (req, res) => {
  const result = await db.collection("carts").updateOne(
    { shopperId: req.body.shopperId },
    { $set: { items: req.body.items } },
    { upsert: true }
  );
  res.json({ success: true });
});

app.get('/api/cart', async (req, res) => {
  const cart = await db.collection("carts").findOne({ shopperId: req.query.shopperId });
  res.json(cart || { items: [] });
});

// Shipping selection
app.post('/api/shipping', async (req, res) => {
  // Simple static rate calc for demo
  const shippingCost = req.body.method === "express" ? 15 : 5;
  res.json({ shippingCost, eta: "3-5 days" });
});

// Billing
app.post('/api/billing', async (req, res) => {
  const result = await db.collection("orders").insertOne(req.body);
  res.json({ success: true, orderId: result.insertedId });
});

// Returns
app.post('/api/returns', async (req, res) => {
  const result = await db.collection("returns").insertOne(req.body);
  res.json({ success: true, returnId: result.insertedId });
});

/* ---------------------------
   START SERVER
----------------------------*/
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});
