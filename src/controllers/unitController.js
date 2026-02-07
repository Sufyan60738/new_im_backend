const PredefinedUnit = require('../models/PredefinedUnit');

/**
 * Get All Predefined Units (Master List)
 * Returns all standard units available for use, grouped by category
 * @route GET /api/units/predefined
 */
exports.getPredefinedUnits = async (req, res) => {
  try {
    // Fetch all units ordered by category and name
    const units = await PredefinedUnit.findAll({
      attributes: ['id', 'name', 'category'],
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    // Group units by category using reduce (more efficient)
    const groupedByCategory = units.reduce((acc, unit) => {
      if (!acc[unit.category]) {
        acc[unit.category] = [];
      }
      acc[unit.category].push(unit.name);
      return acc;
    }, {});

    res.json({
      success: true,
      count: units.length,
      units,
      categories: groupedByCategory
    });
  } catch (error) {
    console.error('Error fetching predefined units:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch predefined units',
      message: error.message
    });
  }
};