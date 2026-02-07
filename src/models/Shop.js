const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * Shop Model - Main shop/company entity for multi-tenant architecture
 * Each shop has a unique name and can have multiple branches
 */
const Shop = sequelize.define('shops', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    shop_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: {
            msg: 'Shop name must be unique'
        },
        validate: {
            notEmpty: {
                msg: 'Shop name cannot be empty'
            },
            len: {
                args: [3, 255],
                msg: 'Shop name must be between 3 and 255 characters'
            }
        }
    },
    shop_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            msg: 'Shop code must be unique'
        }
    },
    owner_name: {
        type: DataTypes.STRING(255),
        allowNull: true
    },
    contact_number: {
        type: DataTypes.STRING(50),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: {
            msg: 'Email already exists'
        },
        validate: {
            isEmail: {
                msg: 'Invalid email format'
            }
        }
    },
    address: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    city: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    country: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: 'Pakistan'
    },
    tax_registration_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'NTN or Sales Tax Number'
    },
    logo: {
        type: DataTypes.BLOB('long'),
        allowNull: true,
        comment: 'Shop logo image'
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Soft delete flag'
    }
}, {
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
        {
            unique: true,
            fields: ['shop_name']
        },
        {
            unique: true,
            fields: ['shop_code']
        },
        {
            fields: ['is_active']
        }
    ],
    hooks: {
        /**
         * Auto-generate shop code before creation
         * Format: SHOP001, SHOP002, etc.
         */
        // ✅ Fixed — transaction use karo aur proper null check
        beforeCreate: async (shop, { transaction }) => {
            if (!shop.shop_code) {
                const lastShop = await Shop.findOne({
                    order: [['id', 'DESC']],
                    attributes: ['shop_code'],
                    transaction   // <-- transaction pass karo
                });

                let nextNumber = 1;
                if (lastShop && lastShop.shop_code) {
                    const lastNumber = parseInt(lastShop.shop_code.replace('SHOP', ''));
                    nextNumber = lastNumber + 1;
                }

                shop.shop_code = `SHOP${String(nextNumber).padStart(3, '0')}`;
            }
        }
    }
});

module.exports = Shop;
