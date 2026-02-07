const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdminController');
const { isAuthenticated, isSuperAdmin } = require('../middleware/roleMiddleware');

/**
 * Super Admin Routes
 * /api/admin
 * All routes require super admin privileges
 */

// Dashboard - Overview of all shops and statistics
router.get('/dashboard', isAuthenticated, isSuperAdmin, superAdminController.getDashboard);

// Get complete data for a specific shop
router.get('/shops/:shopId/data', isAuthenticated, isSuperAdmin, superAdminController.getShopData);

// Get complete data for a specific branch
router.get('/branches/:branchId/data', isAuthenticated, isSuperAdmin, superAdminController.getBranchData);

// Get consolidated report across all shops
router.get('/reports/consolidated', isAuthenticated, isSuperAdmin, superAdminController.getConsolidatedReport);

// Assign user to shop/branch
router.post('/users/:userId/assign-shop', isAuthenticated, isSuperAdmin, superAdminController.assignUserToShop);

// Get all users across all shops
router.get('/users', isAuthenticated, isSuperAdmin, superAdminController.getAllUsers);

module.exports = router;
