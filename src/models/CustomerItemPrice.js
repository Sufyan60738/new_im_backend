const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * CustomerItemPrice Model - Custom prices for specific customer-item combinations
 */
const CustomerItemPrice = sequelize.define('customer_item_prices', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'customers',
            key: 'id'
        }
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'items',
            key: 'id'
        }
    },
    custom_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = CustomerItemPrice;
