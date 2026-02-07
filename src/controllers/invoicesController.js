const db = require('../config/db');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * Helper function to get customer's current balance
 */
const getCustomerBalance = async (customerId) => {
  const query = `
    SELECT remaining_balance 
    FROM filledledger 
    WHERE customer_id = ? 
    ORDER BY created_at DESC, id DESC 
    LIMIT 1
  `;

  const [results] = await db.promise().query(query, [customerId]);
  return results.length > 0 ? results[0].remaining_balance : 0;
};

/**
 * Helper function to create ledger entry
 */
const createLedgerEntry = async (customerId, invoiceId, creditAmount, referenceNumber, previousBalance) => {
  const newBalance = parseFloat(previousBalance) + parseFloat(creditAmount);

  const query = `
    INSERT INTO filledledger (
      customer_id, 
      invoice_id, 
      credit_amount, 
      debit_amount, 
      description, 
      payment_method, 
      reference_number, 
      remaining_balance, 
      transaction_type,
      created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
  `;

  const values = [
    customerId,
    invoiceId,
    creditAmount,
    0, // debit_amount
    `Invoice created - ${referenceNumber}`,
    'invoice',
    referenceNumber,
    newBalance,
    'invoice'
  ];

  const [result] = await db.promise().query(query, values);
  return result;
};

/**
 * @desc    Get all invoices
 * @route   GET /api/invoices
 * @access  Private
 */
const getInvoices = asyncHandler(async (req, res) => {
  const query = `
    SELECT i.*, c.name as customer_name, c.phone_number as customer_phone
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    ORDER BY i.created_at DESC
  `;

  const [results] = await db.promise().query(query);
  res.json(results);
});

/**
 * @desc    Get single invoice with items
 * @route   GET /api/invoices/:id
 * @access  Private
 */
const getInvoiceById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const invoiceQuery = `
    SELECT i.*, c.name as customer_name, c.phone_number as customer_phone, c.address as customer_address
    FROM invoices i
    JOIN customers c ON i.customer_id = c.id
    WHERE i.id = ?
  `;

  const itemsQuery = `
    SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY id
  `;

  const [invoiceResults] = await db.promise().query(invoiceQuery, [id]);

  if (invoiceResults.length === 0) {
    throw new AppError('Invoice not found', 404);
  }

  const [itemsResults] = await db.promise().query(itemsQuery, [id]);

  const invoice = invoiceResults[0];
  invoice.items = itemsResults;
  res.json(invoice);
});

/**
 * @desc    Create new invoice
 * @route   POST /api/invoices
 * @access  Private
 */
const createInvoice = asyncHandler(async (req, res) => {
  const {
    reference_number,
    customer_id,
    transport_company,
    bilti_number,
    invoice_date,
    subtotal,
    discount_amount,
    labour_amount,
    grand_total,
    status,
    notes,
    items
  } = req.body;

  console.log('Creating invoice with data:', {
    reference_number,
    customer_id,
    transport_company,
    bilti_number,
    invoice_date,
    subtotal,
    discount_amount,
    labour_amount,
    grand_total,
    status,
    notes,
    itemsCount: items?.length
  });

  // Validation
  if (!reference_number || !customer_id || !invoice_date || !items || items.length === 0) {
    throw new AppError('Required fields missing', 400);
  }

  // Get connection for transaction
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Get customer's current balance before creating invoice
    const previousBalance = await getCustomerBalance(customer_id);
    console.log('Customer previous balance:', previousBalance);

    // Insert invoice
    const invoiceQuery = `
      INSERT INTO invoices (reference_number, customer_id, transport_company, bilti_number, invoice_date, 
                           subtotal, discount_amount, labour_amount, grand_total, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const invoiceValues = [
      reference_number,
      customer_id,
      transport_company,
      bilti_number,
      invoice_date,
      subtotal || 0,
      discount_amount || 0,
      labour_amount || 0,
      grand_total || 0,
      status || 'draft',
      notes
    ];

    const [invoiceResult] = await connection.query(invoiceQuery, invoiceValues);
    const invoiceId = invoiceResult.insertId;
    console.log('Invoice created with ID:', invoiceId);

    // Insert invoice items
    const itemPromises = items.map(async (item) => {
      const itemQuery = `
        INSERT INTO invoice_items (invoice_id, item_id, item_name, description, quantity, rate, total)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const itemValues = [
        invoiceId,
        item.item_id,
        item.item_name,
        item.description || '',
        item.quantity,
        item.rate,
        item.total
      ];

      return connection.query(itemQuery, itemValues);
    });

    await Promise.all(itemPromises);
    console.log('Invoice items created successfully');

    // Create ledger entry
    await createLedgerEntry(
      customer_id,
      invoiceId,
      grand_total || 0,
      reference_number,
      previousBalance
    );
    console.log('Ledger entry created successfully');

    // Commit transaction
    await connection.commit();
    connection.release();

    console.log('Invoice and ledger entry created successfully');

    // Fetch and return created invoice
    await getInvoiceById({ params: { id: invoiceId } }, res);

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error in invoice creation:', error);
    throw error;
  }
});

/**
 * @desc    Update invoice
 * @route   PUT /api/invoices/:id
 * @access  Private
 */
const updateInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    reference_number,
    customer_id,
    transport_company,
    bilti_number,
    invoice_date,
    subtotal,
    discount_amount,
    labour_amount,
    grand_total,
    status,
    notes,
    items
  } = req.body;

  // Get connection for transaction
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Get old invoice details first
    const oldInvoiceQuery = 'SELECT * FROM invoices WHERE id = ?';
    const [oldInvoiceResult] = await connection.query(oldInvoiceQuery, [id]);

    if (oldInvoiceResult.length === 0) {
      await connection.rollback();
      connection.release();
      throw new AppError('Invoice not found', 404);
    }

    const oldInvoice = oldInvoiceResult[0];
    const oldGrandTotal = oldInvoice.grand_total;

    // Update invoice
    const invoiceQuery = `
      UPDATE invoices SET 
        reference_number = ?, customer_id = ?, transport_company = ?, bilti_number = ?, invoice_date = ?,
        subtotal = ?, discount_amount = ?, labour_amount = ?, grand_total = ?, 
        status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const invoiceValues = [
      reference_number,
      customer_id,
      transport_company,
      bilti_number,
      invoice_date,
      subtotal || 0,
      discount_amount || 0,
      labour_amount || 0,
      grand_total || 0,
      status || 'draft',
      notes,
      id
    ];

    await connection.query(invoiceQuery, invoiceValues);

    // Delete existing items
    await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

    // Insert updated items
    if (items && items.length > 0) {
      const itemPromises = items.map(async (item) => {
        const itemQuery = `
          INSERT INTO invoice_items (invoice_id, item_id, item_name, description, quantity, rate, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const itemValues = [
          id,
          item.item_id,
          item.item_name,
          item.description || '',
          item.quantity,
          item.rate,
          item.total
        ];

        return connection.query(itemQuery, itemValues);
      });

      await Promise.all(itemPromises);
    }

    // Update ledger entry if grand total changed
    if (oldGrandTotal !== grand_total) {
      // Get current customer balance (excluding this invoice's contribution)
      const currentBalance = await getCustomerBalance(customer_id);
      const adjustedBalance = currentBalance - oldGrandTotal; // Remove old contribution
      const newBalance = adjustedBalance + (grand_total || 0); // Add new contribution

      // Update the ledger entry for this invoice
      const updateLedgerQuery = `
        UPDATE filledledger 
        SET credit_amount = ?, remaining_balance = ?, description = ?
        WHERE invoice_id = ?
      `;

      await connection.query(updateLedgerQuery, [
        grand_total || 0,
        newBalance,
        `Invoice updated - ${reference_number}`,
        id
      ]);
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    // Fetch and return updated invoice
    await getInvoiceById({ params: { id } }, res);

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error('Error updating invoice:', error);
    throw error;
  }
});

/**
 * @desc    Delete invoice
 * @route   DELETE /api/invoices/:id
 * @access  Private
 */
const deleteInvoice = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Get connection for transaction
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Delete ledger entry first
    await connection.query('DELETE FROM filledledger WHERE invoice_id = ?', [id]);

    // Delete invoice items
    await connection.query('DELETE FROM invoice_items WHERE invoice_id = ?', [id]);

    // Delete invoice
    const [result] = await connection.query('DELETE FROM invoices WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await connection.rollback();
      connection.release();
      throw new AppError('Invoice not found', 404);
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    res.json({ message: 'Invoice and related ledger entry deleted successfully' });

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
});

/**
 * @desc    Get customer items with custom prices
 * @route   GET /api/invoices/customer/:customer_id/items
 * @access  Private
 */
const getCustomerItems = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  console.log('Getting customer items for customer ID:', customer_id);

  const query = `
    SELECT 
      i.id,
      i.name,
      i.sale_price as default_price,
      COALESCE(cip.custom_price, i.sale_price) as price,
      CASE WHEN cip.custom_price IS NOT NULL THEN 'custom' ELSE 'default' END as price_type
    FROM items i
    LEFT JOIN customer_item_prices cip ON i.id = cip.item_id AND cip.customer_id = ?
    ORDER BY i.name
  `;

  const [results] = await db.promise().query(query, [customer_id]);

  console.log(`Found ${results.length} items for customer ${customer_id}`);
  res.json(results);
});

/**
 * @desc    Generate reference number
 * @route   GET /api/invoices/generate-reference
 * @access  Private
 */
const generateReferenceNumber = asyncHandler(async (req, res) => {
  console.log('Generating reference number...');

  const query = `
    SELECT reference_number FROM invoices 
    WHERE reference_number LIKE 'A-%'
    ORDER BY CAST(SUBSTRING(reference_number, 3) AS UNSIGNED) DESC 
    LIMIT 1
  `;

  const [results] = await db.promise().query(query);

  let nextNumber = 'A-0000';

  if (results.length > 0) {
    const lastRef = results[0].reference_number;
    console.log('Last reference number found:', lastRef);

    if (lastRef && lastRef.startsWith('A-')) {
      const lastNumStr = lastRef.substring(2); // Remove 'A-' prefix
      const lastNum = parseInt(lastNumStr);

      if (!isNaN(lastNum)) {
        const nextNum = lastNum + 1;
        nextNumber = `A-${String(nextNum).padStart(4, '0')}`;
      }
    }
  }

  console.log('Generated reference number:', nextNumber);
  res.json({ reference_number: nextNumber });
});

/**
 * @desc    Get customer ledger
 * @route   GET /api/invoices/customer/:customer_id/ledger
 * @access  Private
 */
const getCustomerLedger = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  const query = `
    SELECT 
      fl.*,
      i.reference_number as invoice_reference
    FROM filledledger fl
    LEFT JOIN invoices i ON fl.invoice_id = i.id
    WHERE fl.customer_id = ?
    ORDER BY fl.created_at DESC, fl.id DESC
  `;

  const [results] = await db.promise().query(query, [customer_id]);
  res.json(results);
});

/**
 * @desc    Get customer current balance
 * @route   GET /api/invoices/customer/:customer_id/balance
 * @access  Private
 */
const getCustomerCurrentBalance = asyncHandler(async (req, res) => {
  const { customer_id } = req.params;

  const balance = await getCustomerBalance(customer_id);
  res.json({ customer_id: parseInt(customer_id), balance: balance });
});

/**
 * @desc    Get invoice items
 * @route   GET /api/invoices/:invoice_id/items
 * @access  Private
 */
const getInvoiceItems = asyncHandler(async (req, res) => {
  const { invoice_id } = req.params;

  const query = `
    SELECT 
      ii.*,
      i.reference_number,
      i.invoice_date,
      i.customer_id
    FROM invoice_items ii
    JOIN invoices i ON ii.invoice_id = i.id
    WHERE ii.invoice_id = ?
    ORDER BY ii.id
  `;

  const [results] = await db.promise().query(query, [invoice_id]);
  res.json(results);
});

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  getCustomerItems,
  generateReferenceNumber,
  getCustomerLedger,
  getCustomerCurrentBalance,
  getInvoiceItems
};