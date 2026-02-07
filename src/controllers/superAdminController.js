const { Shop, Branch, User, Item, Customer, Vendor, Invoice } = require('../models');
const { Op } = require('sequelize');

/**
 * Super Admin Dashboard
 * Get overview of all shops and system statistics
 */
exports.getDashboard = async (req, res) => {
    try {
        const [
            totalShops,
            totalBranches,
            totalUsers,
            totalItems,
            totalCustomers,
            totalVendors,
            totalInvoices
        ] = await Promise.all([
            Shop.count({ where: { is_active: true } }),
            Branch.count({ where: { is_active: true } }),
            User.count({ where: { is_active: true } }),
            Item.count(),
            Customer.count(),
            Vendor.count(),
            Invoice.count()
        ]);

        // Get recent shops
        const recentShops = await Shop.findAll({
            where: { is_active: true },
            limit: 5,
            order: [['created_at', 'DESC']],
            include: [{
                model: Branch,
                as: 'branches',
                where: { is_active: true },
                required: false
            }]
        });

        res.status(200).json({
            success: true,
            dashboard: {
                overview: {
                    totalShops,
                    totalBranches,
                    totalUsers,
                    totalItems,
                    totalCustomers,
                    totalVendors,
                    totalInvoices
                },
                recentShops
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get complete data for a specific shop
 */
exports.getShopData = async (req, res) => {
    try {
        const { shopId } = req.params;

        const shop = await Shop.findOne({
            where: { id: shopId },
            include: [
                {
                    model: Branch,
                    as: 'branches',
                    where: { is_active: true },
                    required: false
                },
                {
                    model: User,
                    as: 'users',
                    where: { is_active: true },
                    required: false,
                    attributes: ['id', 'name', 'email', 'role', 'branch_id']
                }
            ]
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Get shop statistics
        const [itemCount, customerCount, vendorCount, invoiceCount] = await Promise.all([
            Item.count({ where: { shop_id: shopId } }),
            Customer.count({ where: { shop_id: shopId } }),
            Vendor.count({ where: { shop_id: shopId } }),
            Invoice.count({ where: { shop_id: shopId } })
        ]);

        res.status(200).json({
            success: true,
            shop: {
                ...shop.toJSON(),
                statistics: {
                    items: itemCount,
                    customers: customerCount,
                    vendors: vendorCount,
                    invoices: invoiceCount
                }
            }
        });
    } catch (error) {
        console.error('Get shop data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get complete data for a specific branch
 */
exports.getBranchData = async (req, res) => {
    try {
        const { branchId } = req.params;

        const branch = await Branch.findOne({
            where: { id: branchId },
            include: [
                {
                    model: Shop,
                    as: 'shop',
                    attributes: ['id', 'shop_name', 'shop_code']
                },
                {
                    model: User,
                    as: 'users',
                    where: { is_active: true },
                    required: false,
                    attributes: ['id', 'name', 'email', 'role']
                }
            ]
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Get branch statistics
        const [itemCount, customerCount, vendorCount, invoiceCount] = await Promise.all([
            Item.count({ where: { branch_id: branchId } }),
            Customer.count({ where: { branch_id: branchId } }),
            Vendor.count({ where: { branch_id: branchId } }),
            Invoice.count({ where: { branch_id: branchId } })
        ]);

        res.status(200).json({
            success: true,
            branch: {
                ...branch.toJSON(),
                statistics: {
                    items: itemCount,
                    customers: customerCount,
                    vendors: vendorCount,
                    invoices: invoiceCount
                }
            }
        });
    } catch (error) {
        console.error('Get branch data error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get consolidated report across all shops
 */
exports.getConsolidatedReport = async (req, res) => {
    try {
        // Get all shops with their data
        const shops = await Shop.findAll({
            where: { is_active: true },
            include: [{
                model: Branch,
                as: 'branches',
                where: { is_active: true },
                required: false
            }]
        });

        const report = [];

        for (const shop of shops) {
            const [itemCount, customerCount, vendorCount, invoiceCount] = await Promise.all([
                Item.count({ where: { shop_id: shop.id } }),
                Customer.count({ where: { shop_id: shop.id } }),
                Vendor.count({ where: { shop_id: shop.id } }),
                Invoice.count({ where: { shop_id: shop.id } })
            ]);

            report.push({
                shop_id: shop.id,
                shop_name: shop.shop_name,
                shop_code: shop.shop_code,
                total_branches: shop.branches.length,
                statistics: {
                    items: itemCount,
                    customers: customerCount,
                    vendors: vendorCount,
                    invoices: invoiceCount
                }
            });
        }

        res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        console.error('Consolidated report error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Assign user to shop/branch
 */
exports.assignUserToShop = async (req, res) => {
    try {
        const { userId } = req.params;
        const { shop_id, branch_id, role } = req.body;

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Super admin cannot be assigned to shop/branch
        if (role === 'super_admin' || user.role === 'super_admin') {
            return res.status(400).json({
                success: false,
                message: 'Super admin cannot be assigned to shop/branch'
            });
        }

        // Validate shop exists
        if (shop_id) {
            const shopExists = await Shop.findByPk(shop_id);
            if (!shopExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid shop'
                });
            }
        }

        // Validate branch exists and belongs to shop
        if (branch_id) {
            const branchExists = await Branch.findOne({
                where: {
                    id: branch_id,
                    shop_id: shop_id
                }
            });

            if (!branchExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid branch or branch does not belong to the shop'
                });
            }
        }

        // Update user
        await user.update({
            shop_id,
            branch_id,
            role: role || user.role
        });

        res.status(200).json({
            success: true,
            message: 'User assigned successfully',
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                shop_id: user.shop_id,
                branch_id: user.branch_id
            }
        });
    } catch (error) {
        console.error('Assign user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get all users across all shops
 */
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            where: { is_active: true },
            include: [
                {
                    model: Shop,
                    as: 'shop',
                    attributes: ['id', 'shop_name', 'shop_code']
                },
                {
                    model: Branch,
                    as: 'branch',
                    attributes: ['id', 'branch_name', 'branch_code']
                }
            ],
            attributes: { exclude: ['password'] },
            order: [['created_at', 'DESC']]
        });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
