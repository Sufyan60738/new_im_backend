// routes/vendorRoutes.js
const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');

router.post('/', vendorController.addVendor);
router.get('/', vendorController.getVendors);

module.exports = router;
