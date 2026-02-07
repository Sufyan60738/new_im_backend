const express = require('express');
const router = express.Router();
const cashManagementController = require('../controllers/cashManagementController');

// Create new cash transaction
router.post('/', cashManagementController.createCashTransaction);

// Get all transactions (grouped by payment method)
router.get('/all', cashManagementController.getAllCashTransactions);

// Get transactions by payment method (Cash, Online, Slip)
router.get('/method/:method', cashManagementController.getTransactionsByMethod);

// Get summary statistics
router.get('/summary', cashManagementController.getSummaryStats);

// Update transaction
router.put('/:id', cashManagementController.updateCashTransaction);

// Delete transaction
router.delete('/:id', cashManagementController.deleteCashTransaction);

module.exports = router;
