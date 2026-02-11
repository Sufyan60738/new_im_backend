const sequelize = require('../config/sequelize');
const PredefinedUnit = require('./PredefinedUnit');

// Import all models
const Shop = require('./Shop');
const Branch = require('./Branch');
const User = require('./User');
const Category = require('./Category');
const Vendor = require('./Vendor');
const Customer = require('./Customer');
const Item = require('./Item');
const BankAccount = require('./BankAccount');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const Ledger = require('./Ledger');
const CustomerItemPrice = require('./CustomerItemPrice');
const Payment = require('./Payment');
const Quote = require('./Quote');
const QuoteItem = require('./QuoteItem');
const BankTransaction = require('./BankTransaction');
const PurchaseOrder = require('./PurchaseOrder');
const PurchaseOrderItem = require('./PurchaseOrderItem');
const VendorPayment = require('./VendorPayment');
const CashManagement = require('./CashManagement');

/**
 * Define Model Associations
 */

// ===== Multi-Tenant Relationships =====

// Shop - Branch relationship
Shop.hasMany(Branch, {
    foreignKey: 'shop_id',
    as: 'branches',
    onDelete: 'CASCADE'
});
Branch.belongsTo(Shop, {
    foreignKey: 'shop_id',
    as: 'shop'
});

// Shop - User relationship
Shop.hasMany(User, {
    foreignKey: 'shop_id',
    as: 'users'
});
User.belongsTo(Shop, {
    foreignKey: 'shop_id',
    as: 'shop'
});

// Branch - User relationship
Branch.hasMany(User, {
    foreignKey: 'branch_id',
    as: 'users'
});
User.belongsTo(Branch, {
    foreignKey: 'branch_id',
    as: 'branch'
});

// Shop - Business Models relationships
Shop.hasMany(Item, { foreignKey: 'shop_id', as: 'items' });
Shop.hasMany(Customer, { foreignKey: 'shop_id', as: 'customers' });
Shop.hasMany(Vendor, { foreignKey: 'shop_id', as: 'vendors' });
Shop.hasMany(Invoice, { foreignKey: 'shop_id', as: 'invoices' });
Shop.hasMany(PurchaseOrder, { foreignKey: 'shop_id', as: 'purchase_orders' });
Shop.hasMany(BankAccount, { foreignKey: 'shop_id', as: 'bank_accounts' });
Shop.hasMany(Category, { foreignKey: 'shop_id', as: 'categories' });

// Branch - Business Models relationships
Branch.hasMany(Item, { foreignKey: 'branch_id', as: 'items' });
Branch.hasMany(Customer, { foreignKey: 'branch_id', as: 'customers' });
Branch.hasMany(Vendor, { foreignKey: 'branch_id', as: 'vendors' });
Branch.hasMany(Invoice, { foreignKey: 'branch_id', as: 'invoices' });
Branch.hasMany(PurchaseOrder, { foreignKey: 'branch_id', as: 'purchase_orders' });
Branch.hasMany(BankAccount, { foreignKey: 'branch_id', as: 'bank_accounts' });
Branch.hasMany(Category, { foreignKey: 'branch_id', as: 'categories' });

// Business Models - Shop & Branch relationships
Item.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Item.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Customer.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Customer.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Vendor.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Vendor.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Invoice.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Invoice.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

PurchaseOrder.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
PurchaseOrder.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

BankAccount.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
BankAccount.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

Category.belongsTo(Shop, { foreignKey: 'shop_id', as: 'shop' });
Category.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// ===== Existing Business Relationships =====

// Invoice - Customer relationship
Invoice.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});
Customer.hasMany(Invoice, {
    foreignKey: 'customer_id',
    as: 'invoices'
});

// Invoice - InvoiceItem relationship
Invoice.hasMany(InvoiceItem, {
    foreignKey: 'invoice_id',
    as: 'items',
    onDelete: 'CASCADE'
});
InvoiceItem.belongsTo(Invoice, {
    foreignKey: 'invoice_id',
    as: 'invoice'
});

// InvoiceItem - Item relationship
InvoiceItem.belongsTo(Item, {
    foreignKey: 'item_id',
    as: 'item'
});

// Ledger relationships
Ledger.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});
Customer.hasMany(Ledger, {
    foreignKey: 'customer_id',
    as: 'ledger_entries'
});

Ledger.belongsTo(Invoice, {
    foreignKey: 'invoice_id',
    as: 'invoice'
});

// CustomerItemPrice relationships
CustomerItemPrice.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});
CustomerItemPrice.belongsTo(Item, {
    foreignKey: 'item_id',
    as: 'item'
});

Customer.hasMany(CustomerItemPrice, {
    foreignKey: 'customer_id',
    as: 'custom_prices'
});

Item.hasMany(CustomerItemPrice, {
    foreignKey: 'item_id',
    as: 'custom_prices'
});

// Payment relationships
Payment.belongsTo(Customer, {
    foreignKey: 'customer_id',
    as: 'customer'
});
Customer.hasMany(Payment, {
    foreignKey: 'customer_id',
    as: 'payments'
});

Payment.belongsTo(BankAccount, {
    foreignKey: 'bank_id',
    as: 'bank'
});

// Quote - QuoteItem relationship
Quote.hasMany(QuoteItem, {
    foreignKey: 'quote_id',
    as: 'items',
    onDelete: 'CASCADE'
});
QuoteItem.belongsTo(Quote, {
    foreignKey: 'quote_id',
    as: 'quote'
});

// BankTransaction - BankAccount relationship
BankTransaction.belongsTo(BankAccount, {
    foreignKey: 'bank_id',
    as: 'bank'
});
BankAccount.hasMany(BankTransaction, {
    foreignKey: 'bank_id',
    as: 'transactions'
});

// PurchaseOrder - PurchaseOrderItem relationship
PurchaseOrder.hasMany(PurchaseOrderItem, {
    foreignKey: 'purchase_order_id',
    as: 'items',
    onDelete: 'CASCADE'
});
PurchaseOrderItem.belongsTo(PurchaseOrder, {
    foreignKey: 'purchase_order_id',
    as: 'purchase_order'
});

// PurchaseOrderItem - Item relationship
PurchaseOrderItem.belongsTo(Item, {
    foreignKey: 'item_id',
    as: 'item'
});

// VendorPayment - Vendor relationship
VendorPayment.belongsTo(Vendor, {
    foreignKey: 'vendor_id',
    as: 'vendor'
});
Vendor.hasMany(VendorPayment, {
    foreignKey: 'vendor_id',
    as: 'payments'
});

/**
 * Sync database
 * Use { alter: true } in development to update tables without dropping data
 * Use { force: true } only in development to reset all tables (DELETES ALL DATA!)
 */
const syncDatabase = async () => {
    try {
        // Use alter: false to prevent index accumulation (MySQL has 64 index limit)
        // Only use alter: true when explicitly needed via environment variable
        const shouldAlter = process.env.DB_SYNC_ALTER === 'true';

        if (shouldAlter) {
            console.log('⚠️  WARNING: Running with { alter: true } - this may cause index accumulation');
        }

        await sequelize.sync({ alter: shouldAlter });
        console.log('✅ Database synchronized successfully with Sequelize models');
    } catch (error) {
        console.error('❌ Error synchronizing database:', error);
        throw error;
    }
};

// Export all models and sequelize instance
module.exports = {
    sequelize,
    syncDatabase,

    // Export multi-tenant models
    Shop,
    Branch,

    // Export all models
    User,
    Category,
    PredefinedUnit,
    Vendor,
    Customer,
    Item,
    BankAccount,
    Invoice,
    InvoiceItem,
    Ledger,
    CustomerItemPrice,
    Payment,
    Quote,
    QuoteItem,
    BankTransaction,
    PurchaseOrder,
    PurchaseOrderItem,
    VendorPayment,
    CashManagement
};
