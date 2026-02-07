const express = require('express');
const router = express.Router();
const unitController = require('../controllers/unitController');

/**
 * @route   GET /api/units/predefined
 * @desc    Get all predefined units (weight, volume, length, quantity, area, temperature)
 * @access  Public
 */
router.get('/predefined', unitController.getPredefinedUnits);

module.exports = router;