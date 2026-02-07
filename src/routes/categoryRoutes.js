const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// GET /api/categories - Get all categories
router.get('/', categoryController.getCategories);

// GET /api/categories/search - Search categories
router.get('/search', categoryController.searchCategories);

// GET /api/categories/with-count - Get categories with product count
router.get('/with-count', categoryController.getCategoriesWithCount);

// GET /api/categories/:id - Get single category by ID
router.get('/:id', categoryController.getCategoryById);

// POST /api/categories - Create new category
router.post('/', categoryController.addCategory);

// PUT /api/categories/:id - Update category
router.put('/:id', categoryController.updateCategory);

// DELETE /api/categories/:id - Delete category
router.delete('/:id', categoryController.deleteCategory);


module.exports = router;