const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Inventory Management API',
            version: '1.0.0',
            description: 'Complete API documentation for Inventory Management System',
            contact: {
                name: 'API Support',
                email: 'support@inventory.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:4000',
                description: 'Development server'
            }
        ],
        components: {
            schemas: {
                Bank: {
                    type: 'object',
                    required: ['bank_code'],
                    properties: {
                        id: { type: 'integer', description: 'Bank ID' },
                        bank_code: { type: 'string', description: 'Bank code/name' },
                        initial_balance: { type: 'number', description: 'Initial balance' },
                        balance: { type: 'number', description: 'Current balance' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Customer: {
                    type: 'object',
                    required: ['name'],
                    properties: {
                        id: { type: 'integer', description: 'Customer ID' },
                        name: { type: 'string', description: 'Customer name' },
                        address: { type: 'string', description: 'Customer address' },
                        phone_number: { type: 'string', description: 'Phone number' },
                        opening_balance: { type: 'number', description: 'Opening balance' },
                        date_time: { type: 'string', format: 'date-time' },
                        created_at: { type: 'string', format: 'date-time' },
                        updated_at: { type: 'string', format: 'date-time' }
                    }
                },
                Invoice: {
                    type: 'object',
                    required: ['reference_number', 'customer_id', 'invoice_date', 'items'],
                    properties: {
                        id: { type: 'integer', description: 'Invoice ID' },
                        reference_number: { type: 'string', description: 'Invoice reference number' },
                        customer_id: { type: 'integer', description: 'Customer ID' },
                        transport_company: { type: 'string', description: 'Transport company name' },
                        bilti_number: { type: 'string', description: 'Bilti number' },
                        invoice_date: { type: 'string', format: 'date' },
                        subtotal: { type: 'number', description: 'Subtotal amount' },
                        discount_amount: { type: 'number', description: 'Discount amount' },
                        labour_amount: { type: 'number', description: 'Labour charges' },
                        grand_total: { type: 'number', description: 'Grand total' },
                        status: { type: 'string', enum: ['draft', 'pending', 'paid', 'cancelled'] },
                        notes: { type: 'string', description: 'Additional notes' },
                        items: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    item_id: { type: 'integer' },
                                    item_name: { type: 'string' },
                                    description: { type: 'string' },
                                    quantity: { type: 'number' },
                                    rate: { type: 'number' },
                                    total: { type: 'number' }
                                }
                            }
                        }
                    }
                },
                Payment: {
                    type: 'object',
                    required: ['payment_method', 'amount'],
                    properties: {
                        id: { type: 'integer', description: 'Payment ID' },
                        customer_id: { type: 'integer', description: 'Customer ID' },
                        payment_method: { type: 'string', enum: ['Cash', 'Bank', 'Cheque'] },
                        amount: { type: 'number', description: 'Payment amount' },
                        description: { type: 'string', description: 'Payment description' },
                        check_no: { type: 'string', description: 'Cheque number' },
                        check_date: { type: 'string', format: 'date' },
                        bank_id: { type: 'integer', description: 'Bank ID' },
                        status: { type: 'string', enum: ['pending', 'cleared', 'cancelled'] },
                        payment_date: { type: 'string', format: 'date-time' },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', description: 'Error message' },
                        details: { type: 'array', items: { type: 'object' } }
                    }
                }
            }
        }
    },
    apis: ['./src/routes/*.js'] // Path to API route files
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerUi, swaggerSpec };
