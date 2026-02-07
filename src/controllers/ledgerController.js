const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Diagnostic endpoint for testing ledger
 * @route   GET /api/ledger/diagnostic/:customer_id
 * @access  Private
 */
exports.getDiagnostics = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  console.log('=== LEDGER DIAGNOSTIC START ===');
  console.log('Customer ID:', customer_id);

  const diagnostics = {
    customer_id: customer_id,
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Check if customer exists
  const [customerResults] = await db.promise().query(
    'SELECT * FROM customers WHERE id = ?',
    [customer_id]
  );

  diagnostics.tests.customer_exists = {
    success: customerResults.length > 0,
    data: customerResults.length > 0 ? customerResults[0] : null
  };

  // Test 2: Check ledger entries
  const [ledgerResults] = await db.promise().query(
    'SELECT * FROM filledledger WHERE customer_id = ?',
    [customer_id]
  );

  diagnostics.tests.ledger_entries = {
    success: true,
    count: ledgerResults.length,
    sample: ledgerResults.length > 0 ? ledgerResults[0] : null
  };

  // Test 3: Check table structure
  const [structureResults] = await db.promise().query('DESCRIBE filledledger');

  diagnostics.tests.table_structure = {
    success: true,
    columns: structureResults.map(r => r.Field)
  };

  // Test 4: Check for NULL values
  const nullCheckQuery = `
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN customer_id IS NULL THEN 1 ELSE 0 END) as null_customer_id,
      SUM(CASE WHEN credit_amount IS NULL THEN 1 ELSE 0 END) as null_credit,
      SUM(CASE WHEN debit_amount IS NULL THEN 1 ELSE 0 END) as null_debit,
      SUM(CASE WHEN remaining_balance IS NULL THEN 1 ELSE 0 END) as null_balance,
      SUM(CASE WHEN created_at IS NULL THEN 1 ELSE 0 END) as null_created_at
    FROM filledledger 
    WHERE customer_id = ?
  `;

  const [nullResults] = await db.promise().query(nullCheckQuery, [customer_id]);

  diagnostics.tests.null_values = {
    success: true,
    data: nullResults[0]
  };

  console.log('=== DIAGNOSTIC RESULTS ===');
  console.log(JSON.stringify(diagnostics, null, 2));
  console.log('=== DIAGNOSTIC END ===');

  res.json(diagnostics);
});

/**
 * @desc    Get customer ledger with detailed transactions
 * @route   GET /api/ledger/customer/:customer_id
 * @access  Private
 */
exports.getCustomerLedger = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;
  const { start_date, end_date } = req.query;

  console.log('\n=== LEDGER REQUEST START ===');
  console.log('Customer ID:', customer_id);
  console.log('Date Range:', { start_date, end_date });

  // Validate customer_id
  if (!customer_id || isNaN(customer_id)) {
    console.log('❌ Invalid customer ID');
    throw new AppError('Invalid customer ID', 400);
  }

  // Get customer details
  const customerQuery = 'SELECT * FROM customers WHERE id = ?';
  console.log('Executing customer query...');

  const [customerResults] = await db.promise().query(customerQuery, [customer_id]);

  if (customerResults.length === 0) {
    console.log('❌ Customer not found');
    throw new AppError('Customer not found', 404);
  }

  const customer = customerResults[0];
  console.log('✅ Customer found:', customer.name);

  // Build ledger query
  let ledgerQuery = `
    SELECT 
      fl.id,
      fl.customer_id,
      fl.invoice_id,
      fl.created_at,
      COALESCE(fl.credit_amount, 0) as credit_amount,
      COALESCE(fl.debit_amount, 0) as debit_amount,
      fl.description,
      fl.payment_method,
      fl.reference_number,
      COALESCE(fl.remaining_balance, 0) as remaining_balance,
      fl.transaction_type,
      i.reference_number AS invoice_reference,
      i.status AS invoice_status
    FROM filledledger fl
    LEFT JOIN invoices i ON fl.invoice_id = i.id
    WHERE fl.customer_id = ?
  `;

  const queryParams = [customer_id];

  // Add date filtering if provided
  if (start_date && end_date) {
    ledgerQuery += ` AND DATE(fl.created_at) BETWEEN ? AND ?`;
    queryParams.push(start_date, end_date);
    console.log('Date filter applied:', { start_date, end_date });
  }

  ledgerQuery += ` ORDER BY fl.created_at DESC, fl.id DESC`;

  console.log('Executing ledger query...');

  const [ledgerResults] = await db.promise().query(ledgerQuery, queryParams);

  console.log(`✅ Found ${ledgerResults.length} ledger entries`);

  if (ledgerResults.length > 0) {
    console.log('Sample entry:', JSON.stringify(ledgerResults[0], null, 2));
  }

  // Calculate summary
  const summary = {
    total_credit: 0,
    total_debit: 0,
    current_balance: 0,
  };

  ledgerResults.forEach(entry => {
    summary.total_credit += parseFloat(entry.credit_amount || 0);
    summary.total_debit += parseFloat(entry.debit_amount || 0);
  });

  if (ledgerResults.length > 0) {
    summary.current_balance = parseFloat(ledgerResults[0].remaining_balance || 0);
  }

  console.log('Summary calculated:', summary);

  // Prepare response
  const response = {
    customer_name: customer.name || '',
    customer_phone: customer.phone_number || '',
    customer_address: customer.address || '',
    customer_city: customer.city || '',
    ledger: ledgerResults,
    summary: summary
  };

  console.log('✅ Sending response');
  console.log('=== LEDGER REQUEST END ===\n');

  res.json(response);
});

/**
 * @desc    Get all customers with their current balance
 * @route   GET /api/ledger/customers-summary
 * @access  Private
 */
exports.getCustomersSummary = asyncHandler(async (req, res) => {
  console.log('Fetching customers summary...');

  const query = `
    SELECT 
      c.id,
      c.name,
      c.phone_number,
      c.address,
      COALESCE(
        (SELECT remaining_balance 
         FROM filledledger 
         WHERE customer_id = c.id 
         ORDER BY created_at DESC, id DESC 
         LIMIT 1), 0
      ) AS current_balance,
      (SELECT COUNT(*) 
       FROM filledledger 
       WHERE customer_id = c.id) AS transaction_count,
      (SELECT MAX(created_at) 
       FROM filledledger 
       WHERE customer_id = c.id) AS last_transaction_date
    FROM customers c
    ORDER BY c.name ASC
  `;

  const [results] = await db.promise().query(query);

  console.log(`✅ Found ${results.length} customers`);
  res.json(results);
});

/**
 * @desc    Add a payment entry to ledger
 * @route   POST /api/ledger/add-payment
 * @access  Private
 */
exports.addPayment = asyncHandler(async (req, res) => {
  const {
    customer_id,
    debit_amount,
    payment_method,
    reference_number,
    description
  } = req.body;

  console.log('Adding payment:', { customer_id, debit_amount, payment_method });

  if (!customer_id || !debit_amount) {
    throw new AppError('Customer ID and debit amount are required', 400);
  }

  // Get current balance
  const balanceQuery = `
    SELECT remaining_balance 
    FROM filledledger 
    WHERE customer_id = ? 
    ORDER BY created_at DESC, id DESC 
    LIMIT 1
  `;

  const [balanceResults] = await db.promise().query(balanceQuery, [customer_id]);

  const currentBalance = balanceResults.length > 0
    ? parseFloat(balanceResults[0].remaining_balance)
    : 0;
  const newBalance = currentBalance - parseFloat(debit_amount);

  console.log('Balance calculation:', { currentBalance, debit_amount, newBalance });

  // Insert payment entry
  const insertQuery = `
    INSERT INTO filledledger (
      customer_id,
      credit_amount,
      debit_amount,
      description,
      payment_method,
      reference_number,
      remaining_balance,
      transaction_type,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const values = [
    customer_id,
    0,
    debit_amount,
    description || 'Payment received',
    payment_method || 'cash',
    reference_number || '',
    newBalance,
    'payment'
  ];

  const [result] = await db.promise().query(insertQuery, values);

  console.log('Payment added successfully:', result.insertId);

  res.json({
    message: 'Payment added successfully',
    id: result.insertId,
    new_balance: newBalance,
  });
});

/**
 * @desc    Get ledger statistics
 * @route   GET /api/ledger/statistics
 * @access  Private
 */
exports.getStatistics = asyncHandler(async (req, res) => {
  console.log('Fetching ledger statistics...');

  const query = `
    SELECT 
      COUNT(DISTINCT customer_id) AS total_customers,
      COALESCE(SUM(CASE WHEN transaction_type = 'invoice' THEN credit_amount ELSE 0 END), 0) AS total_sales,
      COALESCE(SUM(CASE WHEN transaction_type = 'payment' THEN debit_amount ELSE 0 END), 0) AS total_payments,
      (
        SELECT COUNT(DISTINCT customer_id)
        FROM filledledger fl1
        WHERE (
          SELECT remaining_balance
          FROM filledledger fl2
          WHERE fl2.customer_id = fl1.customer_id
          ORDER BY fl2.created_at DESC, fl2.id DESC
          LIMIT 1
        ) > 0
      ) AS customers_with_balance,
      (
        SELECT COALESCE(SUM(latest_balance), 0)
        FROM (
          SELECT DISTINCT customer_id,
            (SELECT remaining_balance
             FROM filledledger fl2
             WHERE fl2.customer_id = fl1.customer_id
             ORDER BY fl2.created_at DESC, fl2.id DESC
             LIMIT 1
            ) AS latest_balance
          FROM filledledger fl1
        ) AS balances
        WHERE latest_balance > 0
      ) AS total_outstanding
    FROM filledledger
  `;

  const [results] = await db.promise().query(query);

  console.log('Statistics:', results[0]);
  res.json(results[0]);
});

/**
 * @desc    Get top customers by balance
 * @route   GET /api/ledger/top-customers
 * @access  Private
 */
exports.getTopCustomers = asyncHandler(async (req, res) => {
  const { limit = 5 } = req.query;

  console.log('Fetching top customers, limit:', limit);

  const query = `
    SELECT 
      c.id,
      c.name,
      COALESCE(
        (SELECT remaining_balance 
         FROM filledledger 
         WHERE customer_id = c.id 
         ORDER BY created_at DESC, id DESC 
         LIMIT 1), 0
      ) AS current_balance,
      (SELECT COUNT(*) FROM filledledger WHERE customer_id = c.id) AS transaction_count
    FROM customers c
    ORDER BY current_balance DESC
    LIMIT ?
  `;

  const [results] = await db.promise().query(query, [parseInt(limit)]);

  console.log(`Found ${results.length} top customers`);
  res.json(results);
});
