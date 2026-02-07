const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * PurchaseOrderItem Model
 */
const PurchaseOrderItem = sequelize.define('purchase_order_items', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    purchase_order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'purchase_orders',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    item_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'items',
            key: 'id'
        }
    },
    item_name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    purchase_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    total_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    }
}, {
    timestamps: false
});

module.exports = PurchaseOrderItem;
