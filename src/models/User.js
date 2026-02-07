const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * User Model - For authentication
 */
const User = sequelize.define('users', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('super_admin', 'shop_owner', 'branch_manager', 'staff'),
        allowNull: false,
        defaultValue: 'staff',
        comment: 'User role for access control'
    },
    shop_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'shops',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Null for super_admin, required for others'
    },
    branch_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'branches',
            key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'Branch assignment for branch_manager and staff'
    },
    permissions: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'Custom permissions object for fine-grained access control'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Account active status'
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
            fields: ['role']
        },
        {
            fields: ['is_active']
        }
    ],
    validate: {
        /**
         * Validate that non-super-admins have a shop assigned
         */
        shopRequiredForNonAdmin() {
            if (this.role !== 'super_admin' && !this.shop_id) {
                throw new Error('Shop is required for non-admin users');
            }
        },
        /**
         * Validate that branch_manager and staff have a branch assigned
         */
        branchRequiredForStaff() {
            if ((this.role === 'branch_manager' || this.role === 'staff') && !this.branch_id) {
                throw new Error('Branch is required for branch managers and staff');
            }
        }
    }
});

module.exports = User;
