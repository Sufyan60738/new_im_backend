// routes/customerRoutes.js
const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');

router.post('/', customerController.addCustomer);
router.get('/', customerController.getCustomers);

// 🔥 Add this route for name list
router.get('/names', customerController.getCustomerNames);


module.exports = router;
