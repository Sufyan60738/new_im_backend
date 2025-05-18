// controllers/customerController.js
const db = require('../config/db');

exports.addCustomer = (req, res) => {
  const { name, address, phone_number } = req.body;
  db.query(
    'INSERT INTO customers (name, address, phone_number) VALUES (?, ?, ?)',
    [name, address, phone_number],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Customer added' });
    }
  );
};

exports.getCustomers = (req, res) => {
  db.query('SELECT * FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};


exports.getCustomerNames = (req, res) => {
  db.query('SELECT name FROM customers', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results.map(row => row.name));
  });
};
