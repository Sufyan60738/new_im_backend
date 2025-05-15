const express = require('express');
const router = express.Router();
const itemController = require('../controllers/itemControllers');


router.post('/items', itemController.createItem);

module.exports = router;
