const express = require('express');
const router = express.Router();
const branchController = require('../controllers/branchController');
const { isAuthenticated, isSuperAdmin, isShopOwner } = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Branches
 *   description: Multi-tenant branch management
 */

/**
 * @swagger
 * /api/branches/public:
 *   get:
 *     summary: Get branches by shop_id (public - no auth required)
 *     tags: [Branches]
 *     parameters:
 *       - in: query
 *         name: shop_id
 *         schema:
 *           type: integer
 *         description: Shop ID to filter branches
 *     responses:
 *       200:
 *         description: List of branches
 *       500:
 *         description: Server error
 */
router.get('/branches/public', branchController.getBranchesPublic);

/**
 * @swagger
 * /api/branches/public:
 *   post:
 *     summary: Create a new branch (public - for registration)
 *     tags: [Branches]
 *     description: Create branch without authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               -shop_id
 *               - branch_name
 *             properties:
 *               shop_id:
 *                 type: integer
 *               branch_name:
 *                 type: string
 *               manager_name:
 *                 type: string
 *               contact_number:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.post('/branches/public', branchController.createBranchPublic);

/**
 * @swagger
 * /api/shops/{shopId}/branches:
 *   post:
 *     summary: Create a new branch for a shop
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - branch_name
 *               - branch_code
 *             properties:
 *               branch_name:
 *                 type: string
 *                 example: Main Branch
 *               branch_code:
 *                 type: string
 *                 example: MB001
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Branch created successfully
 *       400:
 *         description: Branch already exists
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/shops/:shopId/branches', isAuthenticated, isShopOwner, branchController.createBranch);

/**
 * @swagger
 * /api/shops/{shopId}/branches:
 *   get:
 *     summary: Get all branches for a shop
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: List of branches
 *       500:
 *         description: Server error
 */
router.get('/shops/:shopId/branches', isAuthenticated, branchController.getBranches);

/**
 * @swagger
 * /api/branches/{id}:
 *   get:
 *     summary: Get branch by ID
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch details
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Server error
 */
router.get('/branches/:id', isAuthenticated, branchController.getBranchById);

/**
 * @swagger
 * /api/branches/{id}:
 *   put:
 *     summary: Update branch
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               branch_name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Branch updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Server error
 */
router.put('/branches/:id', isAuthenticated, isShopOwner, branchController.updateBranch);

/**
 * @swagger
 * /api/branches/{id}:
 *   delete:
 *     summary: Delete branch
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Server error
 */
router.delete('/branches/:id', isAuthenticated, isShopOwner, branchController.deleteBranch);

/**
 * @swagger
 * /api/branches/{id}/stats:
 *   get:
 *     summary: Get branch statistics
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Branch statistics
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Server error
 */
router.get('/branches/:id/stats', isAuthenticated, branchController.getBranchStats);

/**
 * @swagger
 * /api/branches/{id}/set-main:
 *   put:
 *     summary: Set branch as main branch
 *     tags: [Branches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Branch ID
 *     responses:
 *       200:
 *         description: Main branch updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Branch not found
 *       500:
 *         description: Server error
 */
router.put('/branches/:id/set-main', isAuthenticated, isShopOwner, branchController.setMainBranch);

module.exports = router;
