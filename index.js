const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const app = express();
require('dotenv').config();

// Initialize Sequelize models
const { syncDatabase } = require('./src/models');


// Import error handler
const { errorHandler } = require('./src/middleware/errorHandler');

// Import Swagger
const { swaggerUi, swaggerSpec } = require('./src/config/swagger');

// Import Routes
const itemRoutes = require('./src/routes/itemRoutes');
const authRoutes = require('./src/routes/authRoutes');
const unitRoutes = require('./src/routes/unitRoutes');
const vendorRoutes = require('./src/routes/vendorRoutes');
const customerRoutes = require('./src/routes/customerRoutes');
const quoteRoutes = require('./src/routes/quoteRoute');
const categoryRoutes = require('./src/routes/categoryRoutes');
const bankRoutes = require('./src/routes/bankRoutes');
const paymentRoutes = require('./src/routes/paymentRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const customerPriceRoutes = require('./src/routes/customerPriceRoutes');
const invoiceRoutes = require('./src/routes/invoiceRoutes');
const cashManagementRoutes = require('./src/routes/cashManagementRoutes');
const ledgerRoutes = require('./src/routes/ledgerRoutes');
const purchaseOrderRoutes = require('./src/routes/purchaseOrders');
const vendorLedgerRoutes = require('./src/routes/vendorLedgerRoutes');

// Multi-tenant routes
const shopRoutes = require('./src/routes/shopRoutes');
const branchRoutes = require('./src/routes/branchRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Multi-tenant Routes (Add at the top for priority)
app.use('/api/shops', shopRoutes);
app.use('/api', branchRoutes);
app.use('/api/admin', adminRoutes);

// Existing Routes
app.use('/api/items', itemRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/customers', customerRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/bank', bankRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api', customerPriceRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/invoices', invoiceRoutes);
app.use('/api/cash-management', cashManagementRoutes);
app.use('/api/ledger', ledgerRoutes);
app.use('/api/purchase-orders', purchaseOrderRoutes);
app.use('/api/vendor-ledger', vendorLedgerRoutes);

// Multer-specific error handling
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large' });
    }
  }
  next(error);
});

// Centralized error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// ✅ NEW: Seed Predefined Units Function
const seedPredefinedUnits = async () => {
  try {
    const PredefinedUnit = require('./src/models/PredefinedUnit');
    const { getAllPredefinedUnits } = require('./src/seeders/predefinedUnits');

    const predefinedUnits = getAllPredefinedUnits();

    let createdCount = 0;
    let existingCount = 0;

    for (const unit of predefinedUnits) {
      const [instance, created] = await PredefinedUnit.findOrCreate({
        where: { name: unit.name },
        defaults: {
          name: unit.name,
          category: unit.category
        }
      });

      if (created) {
        createdCount++;
      } else {
        existingCount++;
      }
    }

    console.log(`✅ Predefined units seeded successfully`);
    console.log(`   📝 Created: ${createdCount} units`);
    console.log(`   ✓ Already exists: ${existingCount} units`);

  } catch (error) {
    console.error('⚠️  Error seeding predefined units:', error.message);
    // Don't crash the server if seeding fails
  }
};

// Start server with Sequelize initialization
const startServer = async () => {
  try {
    console.log('🚀 Starting Inventory Management Backend...\n');

    // Test Sequelize connection
    const { testConnection } = require('./src/config/sequelize');
    const sequelizeConnected = await testConnection();

    if (sequelizeConnected) {
      // Sync database if connection successful
      console.log('📦 Syncing Sequelize models with database...');
      await syncDatabase();

      // Seed predefined units
      await seedPredefinedUnits();
    } else {
      console.log('\n⚠️  Sequelize is disabled - using old MySQL connection only');
    }


    console.log('');

    // Start Express server
    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log('');
      if (sequelizeConnected) {
        console.log('✨ Sequelize Status: Active');
        console.log('   Working: Categories, Units, Vendors, Auth');
      } else {
        console.log('⚠️  Sequelize Status: Inactive');
        console.log('   Check MySQL database connection');
      }
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

startServer();

