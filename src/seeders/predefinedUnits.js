/**
 * Predefined Units Configuration
 * Standard measurement units available for all shops
 */

const PREDEFINED_UNITS = {
    Weight: ['kg', 'gram', 'ton', 'pound', 'ounce', 'milligram'],
    Length: ['meter', 'centimeter', 'kilometer', 'millimeter', 'inch', 'foot', 'yard', 'mile'],
    Volume: ['liter', 'milliliter', 'gallon', 'cup', 'pint', 'quart', 'fluid ounce'],
    Quantity: ['piece', 'dozen', 'box', 'carton', 'pack', 'bundle', 'set', 'pair', 'unit'],
    Area: ['square meter', 'square foot', 'square yard', 'acre', 'hectare'],
    Temperature: ['celsius', 'fahrenheit']
};

/**
 * Get all predefined units as a flat array
 * @returns {Array} Array of {name, category} objects
 */
const getAllPredefinedUnits = () => {
    return Object.entries(PREDEFINED_UNITS).flatMap(([category, units]) =>
        units.map(name => ({ name, category }))
    );
};

/**
 * Get predefined units grouped by category
 * @returns {Object} Units grouped by category
 */
const getPredefinedUnitsByCategory = () => PREDEFINED_UNITS;

/**
 * Get total count of all units
 * @returns {Number} Total number of units
 */
const getTotalUnitsCount = () => {
    return Object.values(PREDEFINED_UNITS).reduce((sum, units) => sum + units.length, 0);
};

module.exports = {
    PREDEFINED_UNITS,
    getAllPredefinedUnits,
    getPredefinedUnitsByCategory,
    getTotalUnitsCount
};