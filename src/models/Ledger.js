const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * Ledger Model - Customer ledger entries (filledledger table)
 */
const Ledger = sequelize.define('filledledger', {
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
    invoice_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'invoices',
            key: 'id'
        }
    },
    credit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
    },
    debit_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    reference_number: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    remaining_balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0
    },
    transaction_type: {
        type: DataTypes.STRING(50),
        allowNull: true
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Ledger;
