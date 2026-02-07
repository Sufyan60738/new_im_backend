const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * BankAccount Model - Bank accounts for cash management
 */
const BankAccount = sequelize.define('bank_accounts', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    bank_code: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    initial_balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
    },
    balance: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0
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
        }
    ]
});

module.exports = BankAccount;
