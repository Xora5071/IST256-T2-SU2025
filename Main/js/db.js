// Main/js/db.js
const { MongoClient } = require('mongodb');
require('dotenv').config();
const URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.MONGO_DB || 'IST256-Storefront';

let client;
let db;

async function connectDB() {
  if (db) return db; // reuse if already connected
  client = new MongoClient(URI);
  await client.connect();
  db = client.db(DB_NAME);
  console.log('Connected to MongoDB: ${DB_NAME}');
  return db;

  // Helpful index: ensure productId is unique
  try {
    await db.collection('products').createIndex({ productId: 1 }, { unique: true });
  } catch (e) {
    console.warn('Index creation warning (products.productId):', e?.message);
  }

  return db;
}

function getDb() {
  if (!db) throw new Error('Database not initialized. Call connectDB() first.');
  return db;
}

module.exports = { connectDB, getDb };