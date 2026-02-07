const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Register new user
 * Supports multi-tenant registration with shop/branch assignment
 */
exports.register = async (req, res) => {
  let {
    name,
    email,
    password,
    role = 'staff',
    shop_id,
    branch_id,
    // For creating new shop during registration
    create_new_shop,
    shop_name,
    shop_owner_name,
    shop_contact,
    shop_email,
    shop_address,
    shop_city
  } = req.body;

  try {
    const { User, Shop, Branch } = require('../models');
    const { validateShopUniqueness } = require('../utils/tenantHelper');
    const sequelize = require('../config/sequelize');

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      let finalShopId = shop_id;
      let finalBranchId = branch_id;
      let finalRole = role;

      // Handle new shop creation during registration
      if (create_new_shop && shop_name) {
        // Validate shop name uniqueness
        const uniqueCheck = await validateShopUniqueness(shop_name);
        if (!uniqueCheck.isUnique) {
          await transaction.rollback();
          return res.status(400).json({ message: uniqueCheck.message });
        }

        // Generate shop code explicitly
        const lastShop = await Shop.findOne({
          order: [['id', 'DESC']],
          attributes: ['shop_code'],
          transaction
        });

        let shopCode = 'SHOP001';
        if (lastShop && lastShop.shop_code) {
          const lastNumber = parseInt(lastShop.shop_code.replace('SHOP', ''));
          const nextNumber = lastNumber + 1;
          shopCode = `SHOP${String(nextNumber).padStart(3, '0')}`;
        }

        // Create new shop with explicit shop_code
        const newShop = await Shop.create({
          shop_name,
          shop_code: shopCode,
          owner_name: shop_owner_name || name,
          contact_number: shop_contact,
          email: shop_email || email,
          address: shop_address,
          city: shop_city,
          is_active: true
        }, { transaction });

        finalShopId = newShop.id;

        // Generate branch code based on shop code
        const lastBranch = await Branch.findOne({
          where: { shop_id: newShop.id },
          order: [['id', 'DESC']],
          attributes: ['branch_code'],
          transaction
        });

        let branchCode = `${newShop.shop_code}-BR001`;
        if (lastBranch && lastBranch.branch_code) {
          const lastNumber = parseInt(lastBranch.branch_code.split('-BR')[1]);
          const nextNumber = lastNumber + 1;
          branchCode = `${newShop.shop_code}-BR${String(nextNumber).padStart(3, '0')}`;
        }

        // Create main branch for the shop
        const mainBranch = await Branch.create({
          shop_id: newShop.id,
          branch_name: 'Main Branch',
          branch_code: branchCode,
          manager_name: name,
          is_main_branch: true,
          is_active: true
        }, { transaction });

        finalBranchId = mainBranch.id;

        // If creating new shop, user becomes shop owner
        finalRole = 'shop_owner';
      }

      // Validate role-based constraints
      if (finalRole === 'super_admin') {
        // Super admin should not have shop/branch
        finalShopId = null;
        finalBranchId = null;
      } else {
        // Non-super admin must have shop
        if (!finalShopId) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Shop is required for non-admin users. Either select a shop or create a new one.'
          });
        }

        // Branch manager and staff must have branch
        if ((finalRole === 'branch_manager' || finalRole === 'staff') && !finalBranchId) {
          await transaction.rollback();
          return res.status(400).json({
            message: 'Branch is required for branch managers and staff'
          });
        }

        // Verify shop exists (with transaction context for newly created shops)
        const shopExists = await Shop.findByPk(finalShopId, { transaction });
        if (!shopExists) {
          await transaction.rollback();
          return res.status(400).json({ message: 'Invalid shop selected' });
        }

        // Verify branch exists and belongs to shop
        if (finalBranchId) {
          const branchExists = await Branch.findOne({
            where: {
              id: finalBranchId,
              shop_id: finalShopId
            },
            transaction
          });
          if (!branchExists) {
            await transaction.rollback();
            return res.status(400).json({
              message: 'Invalid branch selected or branch does not belong to the shop'
            });
          }
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: finalRole,
        shop_id: finalShopId,
        branch_id: finalBranchId,
        permissions: {},
        is_active: true
      }, { transaction });

      await transaction.commit();

      // Generate JWT token for auto-login after registration
      const token = jwt.sign(
        {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          shop_id: newUser.shop_id,
          branch_id: newUser.branch_id
        },
        process.env.JWT_SECRET || 'your-secret-key-here-change-in-production',
        { expiresIn: '30d' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token: token,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          shop_id: newUser.shop_id,
          branch_id: newUser.branch_id
        }
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Login user
 * Returns user with role, shop, and branch information
 */
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const { Shop, Branch } = require('../models');

    // Find user by email with shop and branch info
    const user = await User.findOne({
      where: { email },
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
      ]
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({
        message: 'Account is inactive. Please contact administrator.'
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.password);

    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Prepare user response
    const userResponse = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions,
      shop_id: user.shop_id,
      branch_id: user.branch_id,
      shop: user.shop ? {
        id: user.shop.id,
        name: user.shop.shop_name,
        code: user.shop.shop_code
      } : null,
      branch: user.branch ? {
        id: user.branch.id,
        name: user.branch.branch_name,
        code: user.branch.branch_code
      } : null
    };

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        shop_id: user.shop_id,
        branch_id: user.branch_id
      },
      process.env.JWT_SECRET || 'your-secret-key-here-change-in-production',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: userResponse
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};
