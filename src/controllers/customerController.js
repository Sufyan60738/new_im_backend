const { Customer } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

/**
 * @desc    Get all customers
 * @route   GET /api/customers
 * @access  Private
 */
const getCustomers = asyncHandler(async (req, res) => {
  console.log('📋 Fetching all customers...');

  const customers = await Customer.findAll({
    order: [['name', 'ASC']]
  });

  console.log(`✅ Found ${customers.length} customers`);
  if (customers.length > 0) {
    console.log('📄 First customer sample:', customers[0].toJSON());
  }

  res.json(customers);
});

/**
 * @desc    Get single customer by ID
 * @route   GET /api/customers/:id
 * @access  Private
 */
const getCustomerById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log(`🔍 Fetching customer with ID: ${id}`);

  const customer = await Customer.findByPk(id);

  if (!customer) {
    console.log(`❌ Customer with ID ${id} not found`);
    throw new AppError('Customer not found', 404);
  }

  console.log(`✅ Customer found:`, customer.toJSON());
  res.json(customer);
});

/**
 * @desc    Create new customer
 * @route   POST /api/customers
 * @access  Private
 */
const addCustomer = asyncHandler(async (req, res) => {
  const { name, address, phone_number, opening_balance, date_time } = req.body;

  console.log('➕ Adding new customer:', { name, address, phone_number, opening_balance, date_time });

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  // Validate opening_balance if provided
  let validatedOpeningBalance = null;
  if (opening_balance !== undefined && opening_balance !== null && opening_balance !== '') {
    validatedOpeningBalance = parseFloat(opening_balance);
    if (isNaN(validatedOpeningBalance)) {
      throw new AppError('Opening balance must be a valid number', 400);
    }
  }

  // Validate date_time if provided
  let validatedDateTime = null;
  if (date_time) {
    validatedDateTime = new Date(date_time);
    if (isNaN(validatedDateTime.getTime())) {
      throw new AppError('Invalid date time format', 400);
    }
  }

  const newCustomer = await Customer.create({
    name,
    address,
    phone_number,
    opening_balance: validatedOpeningBalance,
    date_time: validatedDateTime
  });

  console.log(`✅ Customer created with ID: ${newCustomer.id}`);
  res.status(201).json(newCustomer);
});

/**
 * @desc    Update customer
 * @route   PUT /api/customers/:id
 * @access  Private
 */
const updateCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, address, phone_number, opening_balance, date_time } = req.body;

  console.log(`📝 Updating customer ID ${id}:`, { name, address, phone_number, opening_balance, date_time });

  if (!name) {
    throw new AppError('Name is required', 400);
  }

  // Validate opening_balance if provided
  let validatedOpeningBalance = null;
  if (opening_balance !== undefined && opening_balance !== null && opening_balance !== '') {
    validatedOpeningBalance = parseFloat(opening_balance);
    if (isNaN(validatedOpeningBalance)) {
      throw new AppError('Opening balance must be a valid number', 400);
    }
  }

  // Validate date_time if provided
  let validatedDateTime = null;
  if (date_time) {
    validatedDateTime = new Date(date_time);
    if (isNaN(validatedDateTime.getTime())) {
      throw new AppError('Invalid date time format', 400);
    }
  }

  const [updated] = await Customer.update(
    {
      name,
      address,
      phone_number,
      opening_balance: validatedOpeningBalance,
      date_time: validatedDateTime
    },
    { where: { id } }
  );

  if (updated === 0) {
    throw new AppError('Customer not found', 404);
  }

  console.log(`✅ Customer updated successfully`);

  // Fetch and return updated customer
  const updatedCustomer = await Customer.findByPk(id);
  res.json(updatedCustomer);
});

/**
 * @desc    Delete customer
 * @route   DELETE /api/customers/:id
 * @access  Private
 */
const deleteCustomer = asyncHandler(async (req, res) => {
  const { id } = req.params;

  console.log(`🗑️ Deleting customer ID: ${id}`);

  const deleted = await Customer.destroy({ where: { id } });

  if (deleted === 0) {
    throw new AppError('Customer not found', 404);
  }

  console.log(`✅ Customer deleted successfully`);
  res.json({ message: 'Customer deleted successfully' });
});

/**
 * @desc    Get customer names only
 * @route   GET /api/customers/names
 * @access  Private
 */
const getCustomerNames = asyncHandler(async (req, res) => {
  console.log('📋 Fetching customer names...');

  const customers = await Customer.findAll({
    attributes: ['id', 'name'],
    order: [['name', 'ASC']]
  });

  console.log(`✅ Found ${customers.length} customer names`);
  res.json(customers);
});

/**
 * @desc    Get customers with balance summary
 * @route   GET /api/customers/balance
 * @access  Private
 */
const getCustomersWithBalance = asyncHandler(async (req, res) => {
  console.log('📋 Fetching customers with balance...');

  const customers = await Customer.findAll({
    order: [['name', 'ASC']]
  });

  // Add balance_status to each customer
  const customersWithStatus = customers.map(customer => {
    const balance = parseFloat(customer.opening_balance) || 0;
    let balance_status = 'Zero Balance';
    if (balance > 0) balance_status = 'Credit';
    else if (balance < 0) balance_status = 'Debit';

    return {
      ...customer.toJSON(),
      balance_status
    };
  });

  console.log(`✅ Found ${customersWithStatus.length} customers with balance info`);
  res.json(customersWithStatus);
});

module.exports = {
  getCustomers,
  getCustomerById,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getCustomerNames,
  getCustomersWithBalance
};
