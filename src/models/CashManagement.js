const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * CashManagement Model
 */
const CashManagement = sequelize.define('cash_management', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    payment_method: {
        type: DataTypes.ENUM('Cash', 'Online', 'Slip'),
        allowNull: false
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('cash_in', 'cash_out'),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = CashManagement;
