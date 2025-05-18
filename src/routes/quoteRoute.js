// src/routes/quoteRoutes.js
const express = require('express');
const router = express.Router();
const quoteController = require('../controllers/quoteController');

// POST /api/quotes
router.post('/quotes', quoteController.createQuote);

// GET /api/quotes/last-number
router.get('/last-number', quoteController.getLastQuoteNumber);


module.exports = router;
