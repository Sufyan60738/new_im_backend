const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');
const { validate } = require('../middleware/validateRequest');
const { ledgerSchemas } = require('../middleware/validation');

// Diagnostic endpoint
router.get('/diagnostic/:customer_id', ledgerController.getDiagnostics);

// Get customer ledger
router.get('/customer/:customer_id', ledgerController.getCustomerLedger);

// Get customers summary
router.get('/customers-summary', ledgerController.getCustomersSummary);

// Add payment entry
router.post('/add-payment', validate(ledgerSchemas.addPayment), ledgerController.addPayment);

// Get statistics
router.get('/statistics', ledgerController.getStatistics);

// Get top customers
router.get('/top-customers', ledgerController.getTopCustomers);

module.exports = router;

