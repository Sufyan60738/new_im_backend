const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * Item Model - Products/Inventory items
 */
const Item = sequelize.define('items', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    barcode: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    cost_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    sale_price: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    tax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
    },
    vendor: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    qty_on_hand: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    item_picture: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'shops',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    },
    branch_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'branches',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            fields: ['shop_id']
        },
        {
            fields: ['branch_id']
        },
        {
            fields: ['shop_id', 'branch_id']
        }
    ]
});

module.exports = Item;
