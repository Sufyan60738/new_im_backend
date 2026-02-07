// routes/items.js
const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemControllers');

// Items routes with image support
router.post('/', itemController.createItem); // Already includes multer middleware
router.get('/', itemController.getItems);
router.get('/:id', itemController.getItemById);
router.put('/:id', itemController.updateItem); // Already includes multer middleware
router.delete('/:id', itemController.deleteItem);

// Special route to get item image as binary data
router.get('/:id/image', itemController.getItemImage);

module.exports = router;
