const express = require('express');
const router = express.Router();
const purchaseOrderController = require('../controllers/purchaseOrderController');

// Purchase Order routes
router.post('/', purchaseOrderController.createPurchaseOrder);
router.get('/', purchaseOrderController.getPurchaseOrders);
router.get('/:id', purchaseOrderController.getPurchaseOrderById);
router.patch('/:id/status', purchaseOrderController.updatePurchaseOrderStatus);
router.delete('/:id', purchaseOrderController.deletePurchaseOrder);

// Item purchase history
router.get('/item/:itemId/history', purchaseOrderController.getItemPurchaseHistory);

module.exports = router;
