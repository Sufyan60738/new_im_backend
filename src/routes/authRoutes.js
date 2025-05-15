// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../authMiddleware');

router.post('/register', authController.register);
router.post('/login', authController.login);
// router.post('/logout', authController.logout); 


// Protected routes
router.get('/profile', authMiddleware.protect, authController.getProfile);
router.put('/profile', authMiddleware.protect, authController.updateProfile);
router.post('/logout', authMiddleware.protect, authController.logout);

module.exports = router;
