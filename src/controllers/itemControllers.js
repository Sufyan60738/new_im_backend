const db = require('../config/db');


exports.createItem = (req, res) => {
  const { name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description } = req.body;

  if (!name || !cost_price || !sale_price) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  const query = `
    INSERT INTO items (name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const values = [name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error inserting item:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.status(201).json({ message: 'Item saved successfully', id: result.insertId });
  });
};


exports.getItems = (req, res) => {
  const query = 'SELECT * FROM items ORDER BY id DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching items:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

exports.updateItem = (req, res) => {
  const { id } = req.params;
  const { name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description } = req.body;

  if (!name || !cost_price || !sale_price) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  const query = `
    UPDATE items 
    SET name = ?, barcode = ?, unit = ?, cost_price = ?, sale_price = ?, tax = ?, vendor = ?, qty_on_hand = ?, description = ?
    WHERE id = ?
  `;
  const values = [name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description, id];

  db.query(query, values, (err, result) => {
    if (err) {
      console.error('Error updating item:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.json({ message: 'Item updated successfully' });
  });
};
