const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * PredefinedUnit Model - Master list of all available units
 * Yeh table shop-independent hai - sabhi shops ke liye same units
 */
const PredefinedUnit = sequelize.define('predefined_units', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Unit name (e.g., kg, liter, piece)'
    },
    category: {
        type: DataTypes.STRING(50),
        allowNull: false,
        comment: 'Category: weight, volume, length, quantity, area, temperature'
    }
}, {
    timestamps: false,
    tableName: 'predefined_units'
});

module.exports = PredefinedUnit;