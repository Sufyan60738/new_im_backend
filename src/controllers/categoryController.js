const { Category } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all categories
 */
const getCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['category_name', 'ASC']]
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Get single category by ID
 */
const getCategoryById = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  try {
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Create category
 */
const addCategory = async (req, res) => {
  const { category_name } = req.body;

  // Validation
  if (!category_name || category_name.trim().length === 0) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  if (category_name.trim().length < 2) {
    return res.status(400).json({ error: 'Category name must be at least 2 characters long' });
  }

  if (category_name.trim().length > 100) {
    return res.status(400).json({ error: 'Category name must not exceed 100 characters' });
  }

  const trimmedName = category_name.trim();

  try {
    // Check if category name already exists (case-insensitive)
    const existingCategory = await Category.findOne({
      where: {
        category_name: {
          [Op.like]: trimmedName // Case-insensitive search
        }
      }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    // Create new category
    const newCategory = await Category.create({
      category_name: trimmedName
    });

    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Update category
 */
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { category_name } = req.body;

  // Validation
  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  if (!category_name || category_name.trim().length === 0) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  if (category_name.trim().length < 2) {
    return res.status(400).json({ error: 'Category name must be at least 2 characters long' });
  }

  if (category_name.trim().length > 100) {
    return res.status(400).json({ error: 'Category name must not exceed 100 characters' });
  }

  const trimmedName = category_name.trim();

  try {
    // Check if category name already exists (excluding current category)
    const existingCategory = await Category.findOne({
      where: {
        category_name: {
          [Op.like]: trimmedName
        },
        category_id: {
          [Op.ne]: id
        }
      }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    // Update category
    const [updated] = await Category.update(
      { category_name: trimmedName },
      { where: { category_id: id } }
    );

    if (updated === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Fetch updated category
    const updatedCategory = await Category.findByPk(id);
    res.json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Delete category
 */
const deleteCategory = async (req, res) => {
  const { id } = req.params;

  if (!id || isNaN(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  try {
    // Find category first
    const category = await Category.findByPk(id);

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete category
    await category.destroy();

    res.json({
      message: 'Category deleted successfully',
      deletedCategory: category
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Get categories with product count (if you have products table)
 */
const getCategoriesWithCount = async (req, res) => {
  try {
    // Note: This would require a products table with category_id
    // For now, returning basic categories
    const categories = await Category.findAll({
      order: [['category_name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories with count:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Search categories
 */
const searchCategories = async (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return getCategories(req, res);
  }

  try {
    const categories = await Category.findAll({
      where: {
        category_name: {
          [Op.like]: `%${q.trim()}%`
        }
      },
      order: [['category_name', 'ASC']]
    });

    res.json(categories);
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

module.exports = {
  getCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
  getCategoriesWithCount,
  searchCategories
};