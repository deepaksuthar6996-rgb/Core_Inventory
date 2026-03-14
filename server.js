const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/movements', require('./routes/movement'));
app.use('/api/predictor', require('./routes/predictor'));

// Health check
app.get('/', (req, res) => res.json({ status: 'CoreInventory API running' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

app.get('/api/dashboard', async (req, res) => {
  const { db } = require('./db/firebase');
  try {
    const products = await db.collection('products').get();
    const movements = await db.collection('movements').get();

    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;

    products.docs.forEach(doc => {
      const data = doc.data();
      totalStock += data.currentStock || 0;
      if (data.currentStock === 0) outOfStock++;
      else if (data.currentStock <= 10) lowStock++;
    });

    const pendingReceipts = movements.docs
      .filter(d => d.data().type === 'receipt' && d.data().status === 'pending').length;

    const pendingDeliveries = movements.docs
      .filter(d => d.data().type === 'delivery' && d.data().status === 'pending').length;

    res.json({
      totalProducts: products.size,
      totalStock,
      lowStock,
      outOfStock,
      pendingReceipts,
      pendingDeliveries
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
