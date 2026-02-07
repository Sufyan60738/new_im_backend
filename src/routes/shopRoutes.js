const express = require('express');
const router = express.Router();
const shopController = require('../controllers/shopController');
const { isAuthenticated, isSuperAdmin, isShopOwner } = require('../middleware/roleMiddleware');

/**
 * @swagger
 * tags:
 *   name: Shops
 *   description: Multi-tenant shop management
 */

/**
 * @swagger
 * /api/shops/public:
 *   get:
 *     summary: Get all shops (public - no auth required)
 *     tags: [Shops]
 *     description: Retrieve all shops for registration/selection purposes
 *     responses:
 *       200:
 *         description: List of shops
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   shop_name:
 *                     type: string
 *                   shop_code:
 *                     type: string
 *       500:
 *         description: Server error
 */
router.get('/public', shopController.getShopsPublic);

/**
 * @swagger
 * /api/shops:
 *   post:
 *     summary: Create a new shop (Super Admin only)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shop_name
 *               - shop_code
 *             properties:
 *               shop_name:
 *                 type: string
 *                 example: Tech Gammer Store
 *               shop_code:
 *                 type: string
 *                 example: TGS001
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: Shop created successfully
 *       400:
 *         description: Shop already exists
 *       403:
 *         description: Forbidden - Super Admin only
 *       500:
 *         description: Server error
 */
router.post('/', isAuthenticated, isSuperAdmin, shopController.createShop);

/**
 * @swagger
 * /api/shops:
 *   get:
 *     summary: Get all shops (authenticated)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shops
 *       500:
 *         description: Server error
 */
router.get('/', isAuthenticated, shopController.getShops);

/**
 * @swagger
 * /api/shops/{id}:
 *   get:
 *     summary: Get shop by ID
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop details
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/:id', isAuthenticated, shopController.getShopById);

/**
 * @swagger
 * /api/shops/{id}:
 *   put:
 *     summary: Update shop (Super Admin or Shop Owner)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               shop_name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shop updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.put('/:id', isAuthenticated, isShopOwner, shopController.updateShop);

/**
 * @swagger
 * /api/shops/{id}:
 *   delete:
 *     summary: Delete shop (Super Admin only)
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop deleted successfully
 *       403:
 *         description: Forbidden - Super Admin only
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', isAuthenticated, isSuperAdmin, shopController.deleteShop);

/**
 * @swagger
 * /api/shops/{id}/stats:
 *   get:
 *     summary: Get shop statistics
 *     tags: [Shops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Shop ID
 *     responses:
 *       200:
 *         description: Shop statistics
 *       404:
 *         description: Shop not found
 *       500:
 *         description: Server error
 */
router.get('/:id/stats', isAuthenticated, shopController.getShopStats);

module.exports = router;
