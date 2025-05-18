// controllers/vendorController.js
const db = require('../config/db');

exports.addVendor = (req, res) => {
  const { name, address, phone_number } = req.body;
  db.query(
    'INSERT INTO vendors (name, address, phone_number) VALUES (?, ?, ?)',
    [name, address, phone_number],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Vendor added' });
    }
  );
};

exports.getVendors = (req, res) => {
  db.query('SELECT * FROM vendors', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};
