const { Branch, Shop } = require('../models');
const { getBranchStats } = require('../utils/tenantHelper');

/**
 * Create new branch (Shop Owner or Super Admin)
 */
exports.createBranch = async (req, res) => {
    try {
        const { shopId } = req.params;
        const {
            branch_name,
            manager_name,
            contact_number,
            email,
            address,
            city,
            is_main_branch
        } = req.body;

        // Verify shop exists
        const shop = await Shop.findByPk(shopId);
        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Check access - only super admin or shop owner of this shop
        if (req.user.role !== 'super_admin' && req.user.shop_id !== parseInt(shopId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only create branches for your shop.'
            });
        }

        // Check if branch name already exists in this shop
        const existingBranch = await Branch.findOne({
            where: {
                shop_id: shopId,
                branch_name,
                is_active: true
            }
        });

        if (existingBranch) {
            return res.status(400).json({
                success: false,
                message: `Branch "${branch_name}" already exists in this shop`
            });
        }

        // Create branch
        const branch = await Branch.create({
            shop_id: shopId,
            branch_name,
            manager_name,
            contact_number,
            email,
            address,
            city,
            is_main_branch: is_main_branch || false,
            is_active: true
        });

        res.status(201).json({
            success: true,
            message: 'Branch created successfully',
            branch
        });
    } catch (error) {
        console.error('Create branch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get all branches for a shop
 */
exports.getBranches = async (req, res) => {
    try {
        const { shopId } = req.params;

        // Check access
        if (req.user.role !== 'super_admin' && req.user.shop_id !== parseInt(shopId)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const branches = await Branch.findAll({
            where: {
                shop_id: shopId,
                is_active: true
            },
            include: [{
                model: Shop,
                as: 'shop',
                attributes: ['id', 'shop_name', 'shop_code']
            }],
            order: [['is_main_branch', 'DESC'], ['created_at', 'ASC']]
        });

        res.status(200).json({
            success: true,
            count: branches.length,
            branches
        });
    } catch (error) {
        console.error('Get branches error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get all branches for a shop (Public - for registration)
 * No authentication required
 */
exports.getBranchesPublic = async (req, res) => {
    try {
        const { shop_id } = req.query;

        if (!shop_id) {
            return res.status(400).json({
                success: false,
                message: 'shop_id is required'
            });
        }

        const branches = await Branch.findAll({
            where: {
                shop_id: shop_id,
                is_active: true
            },
            attributes: ['id', 'branch_name', 'branch_code', 'is_main_branch'],
            order: [['is_main_branch', 'DESC'], ['branch_name', 'ASC']]
        });

        res.status(200).json(branches);
    } catch (error) {
        console.error('Get branches public error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get branch by ID
 */
exports.getBranchById = async (req, res) => {
    try {
        const { id } = req.params;

        const branch = await Branch.findOne({
            where: { id, is_active: true },
            include: [{
                model: Shop,
                as: 'shop',
                attributes: ['id', 'shop_name', 'shop_code']
            }]
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Check access
        if (req.user.role !== 'super_admin' && req.user.shop_id !== branch.shop_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get branch statistics
        const stats = await getBranchStats(branch.id);

        res.status(200).json({
            success: true,
            branch: {
                ...branch.toJSON(),
                stats
            }
        });
    } catch (error) {
        console.error('Get branch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Update branch
 */
exports.updateBranch = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            branch_name,
            manager_name,
            contact_number,
            email,
            address,
            city,
            is_main_branch
        } = req.body;

        const branch = await Branch.findByPk(id);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Check access - only super admin or shop owner
        if (req.user.role !== 'super_admin' &&
            req.user.role !== 'shop_owner' &&
            req.user.shop_id !== branch.shop_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if new branch name conflicts
        if (branch_name && branch_name !== branch.branch_name) {
            const existingBranch = await Branch.findOne({
                where: {
                    shop_id: branch.shop_id,
                    branch_name,
                    is_active: true,
                    id: { [require('sequelize').Op.ne]: id }
                }
            });

            if (existingBranch) {
                return res.status(400).json({
                    success: false,
                    message: `Branch "${branch_name}" already exists in this shop`
                });
            }
        }

        // Update branch
        await branch.update({
            branch_name: branch_name || branch.branch_name,
            manager_name: manager_name || branch.manager_name,
            contact_number: contact_number || branch.contact_number,
            email: email || branch.email,
            address: address || branch.address,
            city: city || branch.city,
            is_main_branch: is_main_branch !== undefined ? is_main_branch : branch.is_main_branch
        });

        res.status(200).json({
            success: true,
            message: 'Branch updated successfully',
            branch
        });
    } catch (error) {
        console.error('Update branch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete branch (Soft delete)
 */
exports.deleteBranch = async (req, res) => {
    try {
        const { id } = req.params;

        const branch = await Branch.findByPk(id);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Check access
        if (req.user.role !== 'super_admin' &&
            req.user.role !== 'shop_owner' &&
            req.user.shop_id !== branch.shop_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Prevent deleting main branch if it's the only active branch
        if (branch.is_main_branch) {
            const activeBranches = await Branch.count({
                where: {
                    shop_id: branch.shop_id,
                    is_active: true
                }
            });

            if (activeBranches === 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the only active branch. Create another branch first.'
                });
            }
        }

        // Soft delete
        await branch.update({ is_active: false });

        res.status(200).json({
            success: true,
            message: 'Branch deleted successfully'
        });
    } catch (error) {
        console.error('Delete branch error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get branch statistics
 */
exports.getBranchStats = async (req, res) => {
    try {
        const { id } = req.params;

        const branch = await Branch.findByPk(id);

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Check access
        if (req.user.role !== 'super_admin' && req.user.shop_id !== branch.shop_id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const stats = await getBranchStats(id);

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get branch stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
