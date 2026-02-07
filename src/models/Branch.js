const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');

/**
 * Branch Model - Branch/Location entity for shops
 * Each shop can have multiple branches
 */
const Branch = sequelize.define('branches', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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
    branch_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Branch name cannot be empty'
            },
            len: {
                args: [2, 255],
                msg: 'Branch name must be between 2 and 255 characters'
            }
        }
    },
    branch_code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: {
            msg: 'Branch code must be unique'
        }
    },
    manager_name: {
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
    is_main_branch: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indicates if this is the main/head branch'
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
            fields: ['branch_code']
        },
        {
            unique: true,
            fields: ['shop_id', 'branch_name'],
            name: 'unique_branch_per_shop'
        },
        {
            fields: ['shop_id']
        },
        {
            fields: ['is_active']
        }
    ],
    hooks: {
        /**
         * Auto-generate branch code before creation
         * Format: BR001, BR002, etc.
         */
        beforeCreate: async (branch) => {
            if (!branch.branch_code) {
                // Get the last branch to generate next code
                const lastBranch = await Branch.findOne({
                    order: [['id', 'DESC']],
                    attributes: ['branch_code']
                });

                let nextNumber = 1;
                if (lastBranch && lastBranch.branch_code) {
                    const lastNumber = parseInt(lastBranch.branch_code.replace('BR', ''));
                    nextNumber = lastNumber + 1;
                }

                branch.branch_code = `BR${String(nextNumber).padStart(3, '0')}`;
            }
        },
        /**
         * Ensure only one main branch per shop
         */
        beforeSave: async (branch) => {
            if (branch.is_main_branch) {
                // Unset other main branches for this shop
                await Branch.update(
                    { is_main_branch: false },
                    {
                        where: {
                            shop_id: branch.shop_id,
                            id: { [sequelize.Sequelize.Op.ne]: branch.id }
                        }
                    }
                );
            }
        }
    }
});

module.exports = Branch;
