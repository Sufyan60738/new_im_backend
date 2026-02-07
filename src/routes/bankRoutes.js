
// routes/bankRoutes.js
const express = require('express');
const router = express.Router();
const bankController = require('../controllers/bankController');
const { validate } = require('../middleware/validateRequest');
const { bankSchemas } = require('../middleware/validation');

// Get all banks
router.get('/', bankController.getAllBanks);

// Get bank by ID
router.get('/:id', bankController.getBankById);

// Get bank balance
router.get('/:id/balance', bankController.getBankBalance);

// Create new bank
router.post('/', validate(bankSchemas.create), bankController.createBank);

// Update bank
router.put('/:id', validate(bankSchemas.update), bankController.updateBank);

// Delete bank
router.delete('/:id', bankController.deleteBank);

module.exports = router;