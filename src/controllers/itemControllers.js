const db = require('../config/db');

exports.createItem = (req, res) => {
  const { name, price } = req.body;

  if (!name || !price) {
    return res.status(400).json({ error: 'Name and price are required' });
  }

  const query = 'INSERT INTO items (name, price) VALUES (?, ?)';
  db.query(query, [name, price], (err, result) => {
    if (err) {
      console.error('Error inserting item:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Item saved successfully', id: result.insertId });
  });
};
