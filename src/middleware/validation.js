const Joi = require('joi');

/**
 * Bank Validation Schemas
 */
const bankSchemas = {
    create: Joi.object({
        bank_code: Joi.string().required().trim().min(1).max(100),
        initial_balance: Joi.number().default(0)
    }),

    update: Joi.object({
        bank_code: Joi.string().required().trim().min(1).max(100),
        initial_balance: Joi.number().required()
    })
};

/**
 * Customer Validation Schemas
 */
const customerSchemas = {
    create: Joi.object({
        name: Joi.string().required().trim().min(1).max(255),
        address: Joi.string().allow('', null).max(500),
        phone_number: Joi.string().allow('', null).max(20),
        opening_balance: Joi.number().allow(null),
        date_time: Joi.date().iso().allow(null)
    }),

    update: Joi.object({
        name: Joi.string().required().trim().min(1).max(255),
        address: Joi.string().allow('', null).max(500),
        phone_number: Joi.string().allow('', null).max(20),
        opening_balance: Joi.number().allow(null),
        date_time: Joi.date().iso().allow(null)
    })
};

/**
 * Invoice Validation Schemas
 */
const invoiceSchemas = {
    create: Joi.object({
        reference_number: Joi.string().required().trim().min(1).max(50),
        customer_id: Joi.number().integer().positive().required(),
        transport_company: Joi.string().allow('', null).max(255),
        bilti_number: Joi.string().allow('', null).max(100),
        invoice_date: Joi.date().iso().required(),
        subtotal: Joi.number().min(0).default(0),
        discount_amount: Joi.number().min(0).default(0),
        labour_amount: Joi.number().min(0).default(0),
        grand_total: Joi.number().min(0).required(),
        status: Joi.string().valid('draft', 'pending', 'paid', 'cancelled').default('draft'),
        notes: Joi.string().allow('', null).max(1000),
        items: Joi.array().items(
            Joi.object({
                item_id: Joi.number().integer().positive().required(),
                item_name: Joi.string().required().trim().max(255),
                description: Joi.string().allow('', null).max(500),
                quantity: Joi.number().positive().required(),
                rate: Joi.number().min(0).required(),
                total: Joi.number().min(0).required()
            })
        ).min(1).required()
    }),

    update: Joi.object({
        reference_number: Joi.string().required().trim().min(1).max(50),
        customer_id: Joi.number().integer().positive().required(),
        transport_company: Joi.string().allow('', null).max(255),
        bilti_number: Joi.string().allow('', null).max(100),
        invoice_date: Joi.date().iso().required(),
        subtotal: Joi.number().min(0).default(0),
        discount_amount: Joi.number().min(0).default(0),
        labour_amount: Joi.number().min(0).default(0),
        grand_total: Joi.number().min(0).required(),
        status: Joi.string().valid('draft', 'pending', 'paid', 'cancelled').default('draft'),
        notes: Joi.string().allow('', null).max(1000),
        items: Joi.array().items(
            Joi.object({
                item_id: Joi.number().integer().positive().required(),
                item_name: Joi.string().required().trim().max(255),
                description: Joi.string().allow('', null).max(500),
                quantity: Joi.number().positive().required(),
                rate: Joi.number().min(0).required(),
                total: Joi.number().min(0).required()
            })
        ).min(1).required()
    })
};

/**
 * Payment Validation Schemas
 */
const paymentSchemas = {
    create: Joi.object({
        customer_id: Joi.number().integer().positive().allow(null),
        payment_method: Joi.string().valid('Cash', 'Bank', 'Cheque').required(),
        amount: Joi.number().positive().required(),
        description: Joi.string().allow('', null).max(500),
        check_no: Joi.string().allow('', null).max(50),
        check_date: Joi.date().iso().allow(null),
        bank_id: Joi.number().integer().positive().allow(null),
        status: Joi.string().valid('pending', 'cleared', 'cancelled').default('cleared')
    }),

    updateStatus: Joi.object({
        status: Joi.string().valid('pending', 'cleared', 'cancelled').required()
    }),

    createCash: Joi.object({
        amount: Joi.number().positive().required(),
        description: Joi.string().allow('', null).max(500)
    })
};

/**
 * Ledger Validation Schemas
 */
const ledgerSchemas = {
    addPayment: Joi.object({
        customer_id: Joi.number().integer().positive().required(),
        debit_amount: Joi.number().positive().required(),
        payment_method: Joi.string().valid('cash', 'bank', 'cheque').default('cash'),
        reference_number: Joi.string().allow('', null).max(50),
        description: Joi.string().allow('', null).max(500)
    })
};

module.exports = {
    bankSchemas,
    customerSchemas,
    invoiceSchemas,
    paymentSchemas,
    ledgerSchemas
};
