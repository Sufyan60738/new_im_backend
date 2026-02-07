const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * BankTransaction Model - Transactions for bank accounts
 */
const BankTransaction = sequelize.define('bank_transactions', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bank_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'bank_accounts',
            key: 'id'
        }
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

module.exports = BankTransaction;
