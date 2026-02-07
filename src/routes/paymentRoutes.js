const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { validate } = require('../middleware/validateRequest');
const { paymentSchemas } = require('../middleware/validation');

// Create Payment (with image upload and status handling)
router.post('/', paymentController.uploadMiddleware, validate(paymentSchemas.create), paymentController.createPayment);

// Get all payments
router.get('/', paymentController.getAllPayments);

// Get payments by customer ID (with optional status filter)
router.get('/customer/:id', paymentController.getPaymentsByCustomer);

// Get pending checks
router.get('/pending-checks', paymentController.getPendingChecks);

// Update check status (clear/cancel check)
router.put('/status/:id', validate(paymentSchemas.updateStatus), paymentController.updateCheckStatus);

// Get receipt image
router.get('/receipt/:id', paymentController.getReceiptImage);

// Update payment
router.put('/:id', paymentController.uploadMiddleware, paymentController.updatePayment);

// Delete payment
router.delete('/:id', paymentController.deletePayment);

// Create cash entry
router.post('/cash-entries', validate(paymentSchemas.createCash), paymentController.createCashEntry);

module.exports = router;
