const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemControllers');


router.post('/items', itemController.createItem);
router.get('/items', itemController.getItems);
router.put('/items/:id', itemController.updateItem);

module.exports = router;
