// Load environment first
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { ObjectId } = require('mongodb');

const { connectDB, getDb, closeDB } = require('./Main/js/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/* -------------------------------------------------
   DB Init Helper — ensure collections + indexes
-------------------------------------------------- */
async function ensureCollection(name, options = {}) {
  const db = getDb();
  const exists = await db.listCollections({ name }).hasNext();
  if (!exists) {
    await db.createCollection(name, options);
    console.log(`Created collection: ${name}`);
  } else {
    console.log(` Collection exists: ${name}`);
    if (options.validator) {
      await db.command({
        collMod: name,
        validator: options.validator,
        validationLevel: 'moderate'
      });
      console.log(` Updated validator for: ${name}`);
    }
  }
}

async function initDB() {
  const db = getDb();

  // Shopper
  await ensureCollection('shopper', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['email', 'name', 'createdAt'],
        properties: {
          email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
          name: { bsonType: 'string', minLength: 1 },
          phone: { bsonType: ['string', 'null'] },
          createdAt: { bsonType: 'date' }
        },
        additionalProperties: true
      }
    }
  });

  // Products
  await ensureCollection('products', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['productId', 'productDescription', 'productCategory', 'productUOM', 'productPrice'],
        properties: {
          productId: { bsonType: 'string', minLength: 1 },
          productDescription: { bsonType: 'string', minLength: 1 },
          productCategory: { bsonType: 'string', minLength: 1 },
          productUOM: { bsonType: 'string', minLength: 1 },
          productPrice: { bsonType: ['double', 'int', 'decimal'], minimum: 0 },
          active: { bsonType: 'bool' },
          createdAt: { bsonType: 'date' }
        },
        additionalProperties: true
      }
    }
  });

  // Shopping cart
  await ensureCollection('shopping_cart', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shopperId', 'items', 'createdAt'],
        properties: {
          shopperId: { bsonType: ['string', 'objectId'] },
          items: {
            bsonType: 'array',
            items: {
              bsonType: 'object',
              required: ['productId', 'quantity'],
              properties: {
                productId: { bsonType: 'string', minLength: 1 },
                quantity: { bsonType: 'int', minimum: 1 },
                priceAtAdd: { bsonType: ['double', 'int', 'decimal'] }
              },
              additionalProperties: false
            }
          },
          createdAt: { bsonType: 'date' },
          updatedAt: { bsonType: 'date' }
        },
        additionalProperties: true
      }
    }
  });

  // Shipping
  await ensureCollection('shipping', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shopperId', 'address', 'method', 'createdAt'],
        properties: {
          shopperId: { bsonType: ['string', 'objectId'] },
          orderId: { bsonType: 'string' },
          address: {
            bsonType: 'object',
            required: ['line1', 'city', 'state', 'postalCode', 'country'],
            properties: {
              line1: { bsonType: 'string' },
              line2: { bsonType: ['string', 'null'] },
              city: { bsonType: 'string' },
              state: { bsonType: 'string' },
              postalCode: { bsonType: 'string' },
              country: { bsonType: 'string' }
            },
            additionalProperties: false
          },
          method: { bsonType: 'string' },
          cost: { bsonType: ['double', 'int', 'decimal'], minimum: 0 },
          status: { enum: ['pending', 'shipped', 'delivered', 'returned', 'cancelled'] },
          createdAt: { bsonType: 'date' }
        },
        additionalProperties: true
      }
    }
  });

  // Billing
  await ensureCollection('billing', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shopperId', 'amount', 'currency', 'method', 'createdAt'],
        properties: {
          shopperId: { bsonType: ['string', 'objectId'] },
          orderId: { bsonType: 'string' },
          amount: { bsonType: ['double', 'int', 'decimal'], minimum: 0 },
          currency: { bsonType: 'string' },
          method: { bsonType: 'string' },
          status: { enum: ['pending', 'paid', 'refunded', 'failed'] },
          createdAt: { bsonType: 'date' }
        },
        additionalProperties: true
      }
    }
  });

  // Returns
  await ensureCollection('returns', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['shopperId', 'orderId', 'productId', 'status', 'processed_at'],
        properties: {
          shopperId: { bsonType: ['string', 'objectId'] },
          orderId: { bsonType: 'string' },
          productId: { bsonType: 'string' },
          reason: { bsonType: 'string' },
          status: { enum: ['pending', 'received', 'approved', 'rejected', 'refunded'] },
          processed_at: { bsonType: 'date' }
        },
        additionalProperties: true
      }
    }
  });

  // Helpful indexes
  await db.collection('shopper').createIndex({ email: 1 }, { unique: true, name: 'uniq_email' });
  await db.collection('products').createIndex({ productId: 1 }, { unique: true, name: 'uniq_productId' });
  await db.collection('products').createIndex({ productCategory: 1, productPrice: 1 }, { name: 'idx_category_price' });
  await db.collection('products').createIndex({ productDescription: 'text' }, { name: 'text_description' });
  await db.collection('shopping_cart').createIndex({ shopperId: 1 }, { unique: true, name: 'uniq_cart_by_shopper' });
  await db.collection('shopping_cart').createIndex({ 'items.productId': 1 }, { name: 'idx_cart_items_product' });
  await db.collection('shipping').createIndex({ shopperId: 1, createdAt: -1 }, { name: 'idx_shipping_shopper_created' });
  await db.collection('shipping').createIndex({ status: 1 }, { name: 'idx_shipping_status' });
  await db.collection('billing').createIndex({ shopperId: 1, createdAt: -1 }, { name: 'idx_billing_shopper_created' });
  await db.collection('billing').createIndex({ status: 1 }, { name: 'idx_billing_status' });
  await db.collection('returns').createIndex({ shopperId: 1, processed_at: -1 }, { name: 'idx_returns_shopper_processed' });
  await db.collection('returns').createIndex({ status: 1 }, { name: 'idx_returns_status' });

  console.log(' Collections + indexes ready.');
}

/* -------------------------------------------------
   Routes
-------------------------------------------------- */

app.get('/', (req, res) => {
  res.send('API is running — try /health for details');
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Add shopper
app.post('/add-shopper', async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('shopper').insertOne({
      ...req.body,
      createdAt: new Date()
    });
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    console.error('Error adding shopper:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'A shopper with this email already exists.' });
    }
    res.status(500).json({ message: 'Failed to add shopper.' });
  }
});

// Add product
app.post('/api/products', async (req, res) => {
  try {
    const newProduct = req.body;
    if (
      !newProduct.productId ||
      !newProduct.productDescription ||
      !newProduct.productCategory ||
      !newProduct.productUOM ||
      newProduct.productPrice === undefined
    ) {
      return res.status(400).json({ message: 'Missing required product fields.' });
    }

    if (typeof newProduct.productPrice === 'string') {
      const parsed = Number(newProduct.productPrice);
      if (Number.isNaN(parsed)) {
        return res.status(400).json({ message: 'productPrice must be a number.' });
      }
      newProduct.productPrice = parsed;
    }

    const db = getDb();
    const existing = await db.collection('products').findOne({ productId: newProduct.productId });
    if (existing) {
      return res.status(409).json({ message: 'Product with this ID already exists.' });
    }

    const result = await db.collection('products').insertOne({
      ...newProduct,
      active: true,
      createdAt: new Date()
    });

    res.status(201).json({ message: 'Product added successfully', insertedId: result.insertedId });
  } catch (err) {
    console.error('Error adding product:', err);
    if (err?.code === 11000) {
      return res.status(409).json({ message: 'Duplicate productId.' });
    }
    res.status(500).json({ message: 'Error saving product data.' });
  }
});

// Get products
app.get('/api/products', async (req, res) => {
  try {
    const db = getDb();
    const { category, minPrice, maxPrice, q } = req.query;

    const filter = {};
    if (category) filter.productCategory = category;
    if (minPrice || maxPrice) {
      filter.productPrice = {};
      if (minPrice !== undefined) filter.productPrice.$gte = Number(minPrice);
      if (maxPrice !== undefined) filter.productPrice.$lte = Number(maxPrice);
    }
    if (q) {
      filter.$text = { $search: q };
    }

    const products = await db.collection('products').find(filter).toArray();
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ message: 'Error fetching product data.' });
  }
});

/* -------------------------
   Cart endpoints
--------------------------*/

// Get cart by shopperId (shopperId is treated as string here)
app.get('/api/cart/:shopperId', async (req, res) => {
  try {
    const db = getDb();
    const shopperId = String(req.params.shopperId);
    const cart = await db.collection('shopping_cart').findOne({ shopperId });
    if (!cart) return res.status(404).json({ message: 'Cart not found.' });
    res.json(cart);
  } catch (err) {
    console.error('Error fetching cart:', err);
    res.status(500).json({ message: 'Error fetching cart.' });
  }
});

// Add/update item in cart
app.post('/api/cart', async (req, res) => {
  try {
    const { shopperId, productId, quantity } = req.body;
    if (!shopperId || !productId || quantity === undefined) {
      return res.status(400).json({ message: 'shopperId, productId, and quantity are required.' });
    }
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ message: 'quantity must be an integer >= 1.' });
    }

    const db = getDb();

    // If item exists, update quantity
    const updated = await db.collection('shopping_cart').updateOne(
      { shopperId: String(shopperId), 'items.productId': productId },
      {
        $set: { 'items.$.quantity': qty, updatedAt: new Date() }
      }
    );

    if (updated.matchedCount === 0) {
      // No existing item; push into cart (upsert cart doc)
      await db.collection('shopping_cart').updateOne(
        { shopperId: String(shopperId) },
        {
          $setOnInsert: { shopperId: String(shopperId), createdAt: new Date() },
          $set: { updatedAt: new Date() },
          $push: { items: { productId, quantity: qty } }
        },
        { upsert: true }
      );
    }

    const cart = await db.collection('shopping_cart').findOne({ shopperId: String(shopperId) });
    res.status(200).json(cart);
  } catch (err) {
    console.error('Error updating cart:', err);
    res.status(500).json({ message: 'Error updating cart.' });
  }
});

// Optional: remove item from cart
app.post('/api/cart/remove', async (req, res) => {
  try {
    const { shopperId, productId } = req.body;
    if (!shopperId || !productId) {
      return res.status(400).json({ message: 'shopperId and productId are required.' });
    }

    const db = getDb();
    const result = await db.collection('shopping_cart').updateOne(
      { shopperId: String(shopperId) },
      { $pull: { items: { productId } }, $set: { updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: 'Cart not found.' });
    }

    const cart = await db.collection('shopping_cart').findOne({ shopperId: String(shopperId) });
    res.json(cart || { message: 'Item removed; cart may now be empty.' });
  } catch (err) {
    console.error('Error removing cart item:', err);
    res.status(500).json({ message: 'Error removing cart item.' });
  }
});

/* -------------------------
   Shipping & Billing
--------------------------*/

app.post('/api/shipping', async (req, res) => {
  try {
    const { shopperId, orderId, address, method, cost, status } = req.body;
    if (!shopperId || !address || !method) {
      return res.status(400).json({ message: 'shopperId, address, and method are required.' });
    }

    const doc = {
      shopperId: String(shopperId),
      orderId: orderId || undefined,
      address,
      method,
      cost: cost !== undefined ? Number(cost) : undefined,
      status: status || 'pending',
      createdAt: new Date()
    };

    const db = getDb();
    const result = await db.collection('shipping').insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    console.error('Error creating shipping record:', err);
    res.status(500).json({ message: 'Failed to create shipping record.' });
  }
});

app.post('/api/billing', async (req, res) => {
  try {
    const { shopperId, orderId, amount, currency, method, status } = req.body;
    if (!shopperId || amount === undefined || !currency || !method) {
      return res.status(400).json({ message: 'shopperId, amount, currency, and method are required.' });
    }

    const doc = {
      shopperId: String(shopperId),
      orderId: orderId || undefined,
      amount: Number(amount),
      currency,
      method,
      status: status || 'paid',
      createdAt: new Date()
    };

    if (Number.isNaN(doc.amount) || doc.amount < 0) {
      return res.status(400).json({ message: 'amount must be a non-negative number.' });
    }

    const db = getDb();
    const result = await db.collection('billing').insertOne(doc);
    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    console.error('Error creating billing record:', err);
    res.status(500).json({ message: 'Failed to create billing record.' });
  }
});

/* -------------------------
   Returns (kept, slightly hardened)
--------------------------*/
app.post('/api/processReturn', async (req, res) => {
  try {
    const db = getDb();
    const returnData = {
      ...req.body,
      status: req.body?.status || 'pending',
      processed_at: new Date()
    };
    await db.collection('returns').insertOne(returnData);

    res.json({
      status: 'success',
      ...returnData,
      confirmationID: 'RefundID' + Math.floor(Math.random() * 100000)
    });
  } catch (err) {
    console.error('Error processing return:', err);
    res.status(500).json({ message: 'Failed to process return.' });
  }
});

/* -------------------------------------------------
   Bootstrap
-------------------------------------------------- */
(async () => {
  try {
    await connectDB();
    await initDB(); // Ensure collections/indexes before serving
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
})();

/* -------------------------------------------------
   Graceful shutdown (optional)
-------------------------------------------------- */
process.on('SIGINT', async () => {
  try {
    await closeDB?.();
  } finally {
    process.exit(0);
  }
});


