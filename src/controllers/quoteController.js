// src/controllers/quoteController.js
const db = require('../config/db');

exports.createQuote = (req, res) => {
  const {
    customer_name,
    quote_to,
    quote_number,
    date,
    total,
    payments_applied,
    balance_due,
    items
  } = req.body;

  const insertQuote = `
    INSERT INTO quotes (customer_name, quote_to, quote_number, date, total, payments_applied, balance_due)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    insertQuote,
    [customer_name, quote_to, quote_number, date, total, payments_applied, balance_due],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });

      const quoteId = result.insertId;
      const insertItems = items.map(item => [
        quoteId,
        item.description,
        item.qty,
        item.rate,
        item.unit,
        item.amount,
        item.tax
      ]);

      const insertItemsQuery = `
        INSERT INTO quote_items (quote_id, item_description, qty, rate, unit, amount, tax)
        VALUES ?
      `;

      db.query(insertItemsQuery, [insertItems], (err2) => {
        if (err2) return res.status(500).json({ error: err2 });
        res.status(201).json({ message: 'Quote saved successfully', quoteId });
      });
    }
  );
};


// Get the last quote number
exports.getLastQuoteNumber = (req, res) => {
  const query = `SELECT quote_number FROM quotes ORDER BY id DESC LIMIT 1`;

  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: err });

    if (results.length === 0) {
      return res.status(200).send("0"); // No quotes yet, start from 1
    }

    const lastQuote = results[0].quote_number;
    const numberOnly = parseInt(lastQuote.replace(/[^\d]/g, ''), 10);

    res.status(200).send(numberOnly.toString());
  });
};
