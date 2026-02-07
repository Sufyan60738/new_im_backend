const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * QuoteItem Model - Line items in a quote
 */
const QuoteItem = sequelize.define('quote_items', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    quote_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'quotes',
            key: 'id'
        }
    },
    item_description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    qty: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    rate: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    unit: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    tax: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true,
        defaultValue: 0
    }
}, {
    timestamps: false
});

module.exports = QuoteItem;
