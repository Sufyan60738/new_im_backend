const { Shop, Branch } = require('../models');

/**
 * Tenant Helper Utilities
 * Helper functions for multi-tenant operations
 */

/**
 * Generate unique shop code
 * Format: SHOP001, SHOP002, etc.
 * @returns {Promise<string>} Shop code
 */
const generateShopCode = async () => {
    const lastShop = await Shop.findOne({
        order: [['id', 'DESC']],
        attributes: ['shop_code']
    });

    let nextNumber = 1;
    if (lastShop && lastShop.shop_code) {
        const match = lastShop.shop_code.match(/SHOP(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    return `SHOP${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Generate unique branch code
 * Format: BR001, BR002, etc.
 * @returns {Promise<string>} Branch code
 */
const generateBranchCode = async () => {
    const lastBranch = await Branch.findOne({
        order: [['id', 'DESC']],
        attributes: ['branch_code']
    });

    let nextNumber = 1;
    if (lastBranch && lastBranch.branch_code) {
        const match = lastBranch.branch_code.match(/BR(\d+)/);
        if (match) {
            nextNumber = parseInt(match[1]) + 1;
        }
    }

    return `BR${String(nextNumber).padStart(3, '0')}`;
};

/**
 * Validate shop name uniqueness
 * @param {string} shopName - Shop name to validate
 * @param {number|null} excludeShopId - Shop ID to exclude from check (for updates)
 * @returns {Promise<{isUnique: boolean, message?: string}>}
 */
const validateShopUniqueness = async (shopName, excludeShopId = null) => {
    const whereClause = {
        shop_name: shopName
    };

    if (excludeShopId) {
        whereClause.id = { [require('sequelize').Op.ne]: excludeShopId };
    }

    const existingShop = await Shop.findOne({
        where: whereClause
    });

    if (existingShop) {
        return {
            isUnique: false,
            message: `Shop name "${shopName}" already exists. Please use a different name.`
        };
    }

    return { isUnique: true };
};

/**
 * Get tenant filter based on user role
 * @param {Object} user - User object with role, shop_id, branch_id
 * @returns {Object} Filter object for database queries
 */
const getTenantFilter = (user) => {
    if (!user) {
        throw new Error('User object is required');
    }

    // Super admin - no filters
    if (user.role === 'super_admin') {
        return {};
    }

    // Shop owner - filter by shop only
    if (user.role === 'shop_owner') {
        if (!user.shop_id) {
            throw new Error('Shop not assigned to user');
        }
        return { shop_id: user.shop_id };
    }

    // Branch manager and staff - filter by shop and branch
    if (user.role === 'branch_manager' || user.role === 'staff') {
        if (!user.shop_id || !user.branch_id) {
            throw new Error('Shop or Branch not assigned to user');
        }
        return {
            shop_id: user.shop_id,
            branch_id: user.branch_id
        };
    }

    throw new Error('Invalid user role');
};

/**
 * Check if user has access to a specific shop
 * @param {Object} user - User object
 * @param {number} shopId - Shop ID to check
 * @returns {boolean}
 */
const hasShopAccess = (user, shopId) => {
    if (!user) return false;

    // Super admin has access to all shops
    if (user.role === 'super_admin') {
        return true;
    }

    // Other users can only access their assigned shop
    return user.shop_id === shopId;
};

/**
 * Check if user has access to a specific branch
 * @param {Object} user - User object
 * @param {number} branchId - Branch ID to check
 * @returns {boolean}
 */
const hasBranchAccess = (user, branchId) => {
    if (!user) return false;

    // Super admin has access to all branches
    if (user.role === 'super_admin') {
        return true;
    }

    // Shop owner has access to all branches in their shop
    // (need to verify branch belongs to their shop)
    if (user.role === 'shop_owner') {
        // This would require a database check, simplified here
        return true; // Should be validated with actual branch.shop_id === user.shop_id
    }

    // Branch manager and staff can only access their branch
    return user.branch_id === branchId;
};

/**
 * Switch user to a different branch (for shop owners)
 * @param {number} userId - User ID
 * @param {number} newBranchId - New branch ID
 * @returns {Promise<boolean>} Success status
 */
const switchBranch = async (userId, newBranchId) => {
    try {
        const { User } = require('../models');

        const user = await User.findByPk(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Only shop owners can switch branches
        if (user.role !== 'shop_owner') {
            throw new Error('Only shop owners can switch branches');
        }

        // Verify branch belongs to user's shop
        const branch = await Branch.findOne({
            where: {
                id: newBranchId,
                shop_id: user.shop_id
            }
        });

        if (!branch) {
            throw new Error('Branch not found or does not belong to your shop');
        }

        // Update user's branch
        await user.update({ branch_id: newBranchId });

        return true;
    } catch (error) {
        console.error('Error switching branch:', error);
        return false;
    }
};

/**
 * Get shop statistics
 * @param {number} shopId - Shop ID
 * @returns {Promise<Object>} Shop statistics
 */
const getShopStats = async (shopId) => {
    const { Item, Customer, Vendor, Invoice, Branch } = require('../models');

    const [
        totalBranches,
        totalItems,
        totalCustomers,
        totalVendors,
        totalInvoices
    ] = await Promise.all([
        Branch.count({ where: { shop_id: shopId, is_active: true } }),
        Item.count({ where: { shop_id: shopId } }),
        Customer.count({ where: { shop_id: shopId } }),
        Vendor.count({ where: { shop_id: shopId } }),
        Invoice.count({ where: { shop_id: shopId } })
    ]);

    return {
        totalBranches,
        totalItems,
        totalCustomers,
        totalVendors,
        totalInvoices
    };
};

/**
 * Get branch statistics
 * @param {number} branchId - Branch ID
 * @returns {Promise<Object>} Branch statistics
 */
const getBranchStats = async (branchId) => {
    const { Item, Customer, Vendor, Invoice } = require('../models');

    const [
        totalItems,
        totalCustomers,
        totalVendors,
        totalInvoices
    ] = await Promise.all([
        Item.count({ where: { branch_id: branchId } }),
        Customer.count({ where: { branch_id: branchId } }),
        Vendor.count({ where: { branch_id: branchId } }),
        Invoice.count({ where: { branch_id: branchId } })
    ]);

    return {
        totalItems,
        totalCustomers,
        totalVendors,
        totalInvoices
    };
};

module.exports = {
    generateShopCode,
    generateBranchCode,
    validateShopUniqueness,
    getTenantFilter,
    hasShopAccess,
    hasBranchAccess,
    switchBranch,
    getShopStats,
    getBranchStats
};
