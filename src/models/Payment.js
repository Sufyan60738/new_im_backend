const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * Payment Model
 */
const Payment = sequelize.define('payments', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'customers',
            key: 'id'
        }
    },
    payment_method: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'cleared'
    },
    amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    check_no: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    check_date: {
        type: DataTypes.DATE,
        allowNull: true
    },
    receipt_image: {
        type: DataTypes.BLOB('long'),
        allowNull: true
    },
    bank_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'bank_accounts',
            key: 'id'
        }
    },
    payment_date: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
});

module.exports = Payment;
