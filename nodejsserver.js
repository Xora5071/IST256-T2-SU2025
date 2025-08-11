// nodejsserver.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { MongoClient } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'Main')));

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'storefront';

let db;

async function start() {
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  console.log(`Connected to MongoDB: ${uri}/${dbName}`);

  // Example: existing route (adjust as needed)
  app.get('/api/health', (req, res) => res.json({ ok: true }));

  // Shoppers (REST)
  app.post('/api/shoppers', async (req, res) => {
    try {
      const r = await db.collection('shoppers').insertOne(req.body);
      res.status(201).json({ insertedId: r.insertedId });
    } catch (e) {
      if (e.code === 11000) return res.status(409).json({ message: 'Email already exists' });
      console.error(e);
      res.status(500).json({ message: 'Failed to add shopper' });
    }
  });

  app.get('/api/shoppers/:email', async (req, res) => {
    const shopper = await db.collection('shoppers').findOne({ email: req.params.email });
    if (!shopper) return res.status(404).json({ message: 'Not found' });
    res.json(shopper);
  });

  app.put('/api/shoppers/:email', async (req, res) => {
    const r = await db.collection('shoppers').updateOne(
      { email: req.params.email },
      { $set: req.body }
    );
    res.json({ matchedCount: r.matchedCount, modifiedCount: r.modifiedCount });
  });

  // Products
  app.get('/api/products', async (req, res) => {
    const q = (req.query.query || '').trim();
    const filter = q
      ? { $or: [{ name: { $regex: q, $options: 'i' } }, { sku: { $regex: q, $options: 'i' } }] }
      : {};
    const products = await db.collection('products').find(filter).toArray();
    res.json(products);
  });

  // Cart
  app.post('/api/cart', async (req, res) => {
    const { shopperId, items } = req.body;
    if (!shopperId || !Array.isArray(items)) return res.status(400).json({ message: 'Invalid cart payload' });
    await db.collection('carts').updateOne(
      { shopperId },
      { $set: { items, updatedAt: new Date() } },
      { upsert: true }
    );
    res.json({ success: true });
  });

  app.get('/api/cart', async (req, res) => {
    const { shopperId } = req.query;
    if (!shopperId) return res.status(400).json({ message: 'shopperId required' });
    const cart = await db.collection('carts').findOne({ shopperId });
    res.json(cart || { shopperId, items: [] });
  });

  // Shipping quote (simple demo)
  app.post('/api/shipping', async (req, res) => {
    const { method } = req.body;
    const shippingCost = method === 'express' ? 15 : 5;
    res.json({ method, shippingCost, eta: method === 'express' ? '1-2 days' : '3-5 days' });
  });

  // Billing → create order
  app.post('/api/billing', async (req, res) => {
    const order = {
      ...req.body,
      status: 'placed',
      createdAt: new Date()
    };
    const r = await db.collection('orders').insertOne(order);
    res.json({ success: true, orderId: r.insertedId });
  });

  // Returns
  app.post('/api/returns', async (req, res) => {
    const ret = { ...req.body, status: 'requested', createdAt: new Date() };
    const r = await db.collection('returns').insertOne(ret);
    res.json({ success: true, returnId: r.insertedId });
  });

  app.listen(PORT, () => {
    console.log(`Express server running at http://localhost:${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
