const { Shop, Branch, User } = require('../models');
const { validateShopUniqueness, getShopStats } = require('../utils/tenantHelper');

/**
 * Create new shop (Super Admin only)
 */
exports.createShop = async (req, res) => {
    try {
        const {
            shop_name,
            owner_name,
            contact_number,
            email,
            address,
            city,
            country,
            tax_registration_number
        } = req.body;

        // Validate shop name uniqueness
        const uniqueCheck = await validateShopUniqueness(shop_name);
        if (!uniqueCheck.isUnique) {
            return res.status(400).json({
                success: false,
                message: uniqueCheck.message
            });
        }

        // Create shop
        const shop = await Shop.create({
            shop_name,
            owner_name,
            contact_number,
            email,
            address,
            city,
            country: country || 'Pakistan',
            tax_registration_number,
            is_active: true
        });

        // Create main branch automatically
        const mainBranch = await Branch.create({
            shop_id: shop.id,
            branch_name: 'Main Branch',
            manager_name: owner_name,
            contact_number,
            email,
            address,
            city,
            is_main_branch: true,
            is_active: true
        });

        res.status(201).json({
            success: true,
            message: 'Shop created successfully',
            shop: {
                id: shop.id,
                shop_name: shop.shop_name,
                shop_code: shop.shop_code,
                email: shop.email,
                main_branch: {
                    id: mainBranch.id,
                    branch_name: mainBranch.branch_name,
                    branch_code: mainBranch.branch_code
                }
            }
        });
    } catch (error) {
        console.error('Create shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get all shops (Super Admin) or user's shop (Others)
 */
exports.getShops = async (req, res) => {
    try {
        let shops;

        if (req.user.role === 'super_admin') {
            // Super admin can see all shops
            shops = await Shop.findAll({
                where: { is_active: true },
                include: [{
                    model: Branch,
                    as: 'branches',
                    where: { is_active: true },
                    required: false
                }],
                order: [['created_at', 'DESC']]
            });
        } else {
            // Others can only see their shop
            if (!req.user.shop_id) {
                return res.status(400).json({
                    success: false,
                    message: 'No shop assigned to user'
                });
            }

            shops = await Shop.findAll({
                where: {
                    id: req.user.shop_id,
                    is_active: true
                },
                include: [{
                    model: Branch,
                    as: 'branches',
                    where: { is_active: true },
                    required: false
                }]
            });
        }

        res.status(200).json({
            success: true,
            count: shops.length,
            shops
        });
    } catch (error) {
        console.error('Get shops error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get all shops (Public - for registration)
 * No authentication required
 */
exports.getShopsPublic = async (req, res) => {
    try {
        const shops = await Shop.findAll({
            where: { is_active: true },
            attributes: ['id', 'shop_name', 'shop_code', 'email', 'city'],
            order: [['shop_name', 'ASC']]
        });

        res.status(200).json(shops);
    } catch (error) {
        console.error('Get shops public error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Create new shop (Public - for registration)
 * No authentication required, creates shop + main branch
 */
exports.createShopPublic = async (req, res) => {
    try {
        const {
            shop_name,
            owner_name,
            contact_number,
            email,
            address,
            city,
            country,
            tax_registration_number
        } = req.body;

        // Validate required fields
        if (!shop_name || !owner_name) {
            return res.status(400).json({
                success: false,
                message: 'Shop name and owner name are required'
            });
        }

        // Validate shop name uniqueness
        const uniqueCheck = await validateShopUniqueness(shop_name);
        if (!uniqueCheck.isUnique) {
            return res.status(400).json({
                success: false,
                message: uniqueCheck.message
            });
        }

        // Generate shop_code
        const lastShop = await Shop.findOne({
            order: [['id', 'DESC']],
            attributes: ['shop_code']
        });

        let nextNumber = 1;
        if (lastShop && lastShop.shop_code) {
            const lastNumber = parseInt(lastShop.shop_code.replace('SHOP', ''));
            nextNumber = lastNumber + 1;
        }
        const shop_code = `SHOP${String(nextNumber).padStart(3, '0')}`;

        // Create shop
        const shop = await Shop.create({
            shop_name: shop_name.trim(),
            shop_code: shop_code,
            owner_name: owner_name.trim(),
            contact_number: contact_number && contact_number.trim() !== '' ? contact_number.trim() : null,
            email: email && email.trim() !== '' ? email.trim() : null,
            address: address && address.trim() !== '' ? address.trim() : null,
            city: city && city.trim() !== '' ? city.trim() : null,
            country: country && country.trim() !== '' ? country.trim() : 'Pakistan',
            tax_registration_number: tax_registration_number && tax_registration_number.trim() !== '' ? tax_registration_number.trim() : null,
            is_active: true
        });

        // Generate branch_code for main branch
        const branch_code = `${shop_code}-BR001`;

        // Create main branch automatically
        const mainBranch = await Branch.create({
            shop_id: shop.id,
            branch_name: 'Main Branch',
            branch_code: branch_code,
            manager_name: owner_name.trim(),
            contact_number: contact_number && contact_number.trim() !== '' ? contact_number.trim() : null,
            email: email && email.trim() !== '' ? email.trim() : null,
            address: address && address.trim() !== '' ? address.trim() : null,
            city: city && city.trim() !== '' ? city.trim() : null,
            is_main_branch: true,
            is_active: true
        });

        res.status(201).json({
            success: true,
            message: 'Shop created successfully',
            shop: {
                id: shop.id,
                shop_name: shop.shop_name,
                shop_code: shop.shop_code,
                owner_name: shop.owner_name,
                email: shop.email,
                main_branch: {
                    id: mainBranch.id,
                    branch_name: mainBranch.branch_name,
                    branch_code: mainBranch.branch_code
                }
            }
        });
    } catch (error) {
        console.error('Create shop public error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get shop by ID
 */
exports.getShopById = async (req, res) => {
    try {
        const { id } = req.params;

        // Check access
        if (req.user.role !== 'super_admin' && req.user.shop_id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view your own shop.'
            });
        }

        const shop = await Shop.findOne({
            where: { id, is_active: true },
            include: [{
                model: Branch,
                as: 'branches',
                where: { is_active: true },
                required: false
            }]
        });

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Get shop statistics
        const stats = await getShopStats(shop.id);

        res.status(200).json({
            success: true,
            shop: {
                ...shop.toJSON(),
                stats
            }
        });
    } catch (error) {
        console.error('Get shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Update shop
 */
exports.updateShop = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            shop_name,
            owner_name,
            contact_number,
            email,
            address,
            city,
            country,
            tax_registration_number
        } = req.body;

        // Check access
        if (req.user.role !== 'super_admin' && req.user.shop_id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only update your own shop.'
            });
        }

        const shop = await Shop.findByPk(id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Validate shop name uniqueness if changing name
        if (shop_name && shop_name !== shop.shop_name) {
            const uniqueCheck = await validateShopUniqueness(shop_name, id);
            if (!uniqueCheck.isUnique) {
                return res.status(400).json({
                    success: false,
                    message: uniqueCheck.message
                });
            }
        }

        // Update shop
        await shop.update({
            shop_name: shop_name || shop.shop_name,
            owner_name: owner_name || shop.owner_name,
            contact_number: contact_number || shop.contact_number,
            email: email || shop.email,
            address: address || shop.address,
            city: city || shop.city,
            country: country || shop.country,
            tax_registration_number: tax_registration_number || shop.tax_registration_number
        });

        res.status(200).json({
            success: true,
            message: 'Shop updated successfully',
            shop
        });
    } catch (error) {
        console.error('Update shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Delete shop (Soft delete)
 */
exports.deleteShop = async (req, res) => {
    try {
        const { id } = req.params;

        const shop = await Shop.findByPk(id);

        if (!shop) {
            return res.status(404).json({
                success: false,
                message: 'Shop not found'
            });
        }

        // Soft delete
        await shop.update({ is_active: false });

        // Also deactivate all branches
        await Branch.update(
            { is_active: false },
            { where: { shop_id: id } }
        );

        res.status(200).json({
            success: true,
            message: 'Shop deleted successfully'
        });
    } catch (error) {
        console.error('Delete shop error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};

/**
 * Get shop statistics
 */
exports.getShopStats = async (req, res) => {
    try {
        const { id } = req.params;

        // Check access
        if (req.user.role !== 'super_admin' && req.user.shop_id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const stats = await getShopStats(id);

        res.status(200).json({
            success: true,
            stats
        });
    } catch (error) {
        console.error('Get shop stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
};
