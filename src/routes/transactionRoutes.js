const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// 🔹 POST /api/transactions - Create new transaction
router.post('/', transactionController.createTransaction);

// 🔹 GET /api/transactions/:bankId - Get all transactions for a specific bank
router.get('/:bankId', transactionController.getBankTransactions);

// 🔹 PUT /api/transactions/:id - Update transaction
router.put('/:id', transactionController.updateTransaction);

// 🔹 DELETE /api/transactions/:id - Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;