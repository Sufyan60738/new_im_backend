const express = require('express');
const router = express.Router();
const db = require('../config/db');
const customerController = require('../controllers/customerPriceController');

// Customers & items
router.get('/customers', (req, res) => {
  db.query('SELECT id, name, email, phone FROM customers ORDER BY name', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

router.get('/items', (req, res) => {
  db.query('SELECT id, name, sale_price, category FROM items ORDER BY name', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

// Customer item pricing
router.post('/customer-item-price', customerController.setCustomerItemPrice);
router.get('/customer-item-price/:customer_id/:item_id', customerController.getCustomerItemPrice);
router.get('/customer-prices/:customer_id', customerController.getCustomerPrices);
router.put('/customer-item-price/:customer_id/:item_id', customerController.updateCustomerItemPrice);
router.delete('/customer-item-price/:customer_id/:item_id', customerController.deleteCustomerItemPrice);

// Extra: Detailed customer prices
router.get('/customer-prices-detailed/:customer_id', (req, res) => {
  const { customer_id } = req.params;
  const query = `
    SELECT cip.id, cip.item_id, cip.custom_price, cip.updated_at,
           i.name as item_name, i.sale_price as default_price, c.name as customer_name
    FROM customer_item_prices cip
    JOIN items i ON cip.item_id = i.id
    JOIN customers c ON cip.customer_id = c.id
    WHERE cip.customer_id = ?
    ORDER BY cip.updated_at DESC
  `;

  db.query(query, [customer_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

module.exports = router;
