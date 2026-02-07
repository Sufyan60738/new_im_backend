const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const { validate } = require('../middleware/validateRequest');
const { customerSchemas } = require('../middleware/validation');

// Create
router.post('/', validate(customerSchemas.create), customerController.addCustomer);

// Read
router.get('/', customerController.getCustomers);
router.get('/:id', customerController.getCustomerById);

// Names list
router.get('/names/list', customerController.getCustomerNames);

// Update
router.put('/:id', validate(customerSchemas.update), customerController.updateCustomer);

// Delete
router.delete('/:id', customerController.deleteCustomer);

module.exports = router;

