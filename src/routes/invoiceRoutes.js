const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoicesController');
const { validate } = require('../middleware/validateRequest');
const { invoiceSchemas } = require('../middleware/validation');

// SPECIFIC ROUTES FIRST
router.get('/generate/reference-number', invoiceController.generateReferenceNumber);
router.get('/customer-items/:customer_id', invoiceController.getCustomerItems);
router.get('/invoice-items/:invoice_id', invoiceController.getInvoiceItems);

// LEDGER ROUTES
router.get('/customer-ledger/:customer_id', invoiceController.getCustomerLedger);
router.get('/customer-balance/:customer_id', invoiceController.getCustomerCurrentBalance);

// Invoice CRUD operations
router.post('/', validate(invoiceSchemas.create), invoiceController.createInvoice);
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.put('/:id', validate(invoiceSchemas.update), invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);

module.exports = router;
