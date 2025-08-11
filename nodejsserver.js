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

    // Insert sample document
    const customersCollection = db.collection("pract");
    const customer = { _id: 1, name: "John Doe", address: "123, City, State", orderdata: "Gameboy" };
    customersCollection.insertOne(customer).then(() => {
      console.log("1 document inserted");
    });
  })
  .catch(err => console.error("MongoDB connection error:", err));

// Example API route
app.get('/api/customers', async (req, res) => {
  const customers = await db.collection("pract").find().toArray();
  res.json(customers);
});

// Start server
app.listen(PORT, () => {
  console.log(`Express server running at http://localhost:${PORT}`);
});

