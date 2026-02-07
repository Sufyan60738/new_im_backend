// routes/vendorLedgerRoutes.js
const express = require('express');
const router = express.Router();
const vendorLedgerController = require('../controllers/vendorLedgerController');

// Get all vendor ledger summaries
router.get('/summaries', vendorLedgerController.getVendorLedgerSummaries);

// Get detailed ledger for specific vendor
router.get('/:vendorId', vendorLedgerController.getVendorLedgerDetail);

// Add payment to vendor
router.post('/payments', vendorLedgerController.addVendorPayment);

// Get vendor payments
router.get('/:vendorId/payments', vendorLedgerController.getVendorPayments);

// Delete vendor payment
router.delete('/payments/:id', vendorLedgerController.deleteVendorPayment);

module.exports = router;   