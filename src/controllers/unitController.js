const db = require('../config/db');

exports.getAllUnits = (req, res) => {
  db.query('SELECT * FROM units', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.addUnit = (req, res) => {
  const { name } = req.body;
  db.query('INSERT INTO units (name) VALUES (?)', [name], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: 'Unit added' });
  });
};
