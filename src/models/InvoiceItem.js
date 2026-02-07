const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * InvoiceItem Model - Line items in an invoice
 */
const InvoiceItem = sequelize.define('invoice_items', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'invoices',
            key: 'id'
        }
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
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    rate: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    total: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
});

module.exports = InvoiceItem;
