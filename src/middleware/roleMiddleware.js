/**
 * Role-Based Access Control Middleware
 * Provides authorization checks for different user roles
 */

/**
 * Check if user is authenticated (basic check)
 */
const isAuthenticated = (req, res, next) => {
    if (!req.user || !req.user.id) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Check if user account is active
    if (req.user.is_active === false) {
        return res.status(403).json({
            success: false,
            message: 'Account is inactive. Please contact administrator.'
        });
    }

    next();
};

/**
 * Check if user is Super Admin
 * Super admins have access to all shops and branches
 */
const isSuperAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Super admin privileges required.'
        });
    }
    next();
};

/**
 * Check if user is Shop Owner or higher
 * Shop owners can manage their shop and all its branches
 */
const isShopOwner = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const allowedRoles = ['super_admin', 'shop_owner'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Shop owner privileges required.'
        });
    }
    next();
};

/**
 * Check if user is Branch Manager or higher
 * Branch managers can manage their specific branch
 */
const isBranchManager = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const allowedRoles = ['super_admin', 'shop_owner', 'branch_manager'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Branch manager privileges required.'
        });
    }
    next();
};

/**
 * Check if user has a specific permission
 * @param {string} permission - Permission to check
 */
const hasPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Super admin has all permissions
        if (req.user.role === 'super_admin') {
            return next();
        }

        // Check custom permissions
        if (req.user.permissions && req.user.permissions[permission]) {
            return next();
        }

        return res.status(403).json({
            success: false,
            message: `Access denied. Required permission: ${permission}`
        });
    };
};

/**
 * Attach tenant scope to request
 * Adds shop_id and branch_id filters based on user role
 * Super admins get no filters, normal users get their shop/branch filters
 */
const attachTenantScope = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Initialize tenant filter
    req.tenantFilter = {};

    // Super admin - no filters, can see all data
    if (req.user.role === 'super_admin') {
        req.tenantFilter = {};
        req.isSuperAdmin = true;
        return next();
    }

    // Shop owner - filter by shop_id only (can see all branches in their shop)
    if (req.user.role === 'shop_owner') {
        if (!req.user.shop_id) {
            return res.status(400).json({
                success: false,
                message: 'Shop not assigned to user'
            });
        }
        req.tenantFilter.shop_id = req.user.shop_id;
        req.isShopOwner = true;
        return next();
    }

    // Branch manager and staff - filter by both shop_id and branch_id
    if (req.user.role === 'branch_manager' || req.user.role === 'staff') {
        if (!req.user.shop_id || !req.user.branch_id) {
            return res.status(400).json({
                success: false,
                message: 'Shop or Branch not assigned to user'
            });
        }
        req.tenantFilter.shop_id = req.user.shop_id;
        req.tenantFilter.branch_id = req.user.branch_id;
        return next();
    }

    return res.status(403).json({
        success: false,
        message: 'Invalid user role'
    });
};

/**
 * Ensure super admin cannot be assigned to shop/branch
 * Used in user registration/update
 */
const validateSuperAdminConstraints = (req, res, next) => {
    if (req.body.role === 'super_admin') {
        // Super admin should not have shop_id or branch_id
        if (req.body.shop_id || req.body.branch_id) {
            return res.status(400).json({
                success: false,
                message: 'Super admin cannot be assigned to a shop or branch'
            });
        }
    } else {
        // Non-super admin must have shop_id
        if (!req.body.shop_id) {
            return res.status(400).json({
                success: false,
                message: 'Shop is required for non-admin users'
            });
        }

        // Branch manager and staff must have branch_id
        if ((req.body.role === 'branch_manager' || req.body.role === 'staff') && !req.body.branch_id) {
            return res.status(400).json({
                success: false,
                message: 'Branch is required for branch managers and staff'
            });
        }
    }
    next();
};

module.exports = {
    isAuthenticated,
    isSuperAdmin,
    isShopOwner,
    isBranchManager,
    hasPermission,
    attachTenantScope,
    validateSuperAdminConstraints
};
