const db = require("../config/db");
const asyncHandler = require("../utils/asyncHandler");
const { AppError } = require("../middleware/errorHandler");
const multer = require('multer');
const path = require('path');

// ✅ Configure multer with relaxed validation for mobile uploads
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    const allowedExtensions = /jpeg|jpg|png|gif|webp|bmp|tiff/i;
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff',
      'application/octet-stream'
    ];

    const extname = allowedExtensions.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype.toLowerCase());

    if (extname) {
      console.log('File accepted based on extension');
      return cb(null, true);
    } else if (mimetype && extname) {
      console.log('File accepted based on MIME type and extension');
      return cb(null, true);
    } else {
      console.log('File rejected - Extension valid:', extname, 'MIME type valid:', mimetype);
      return cb(new Error("Only image files are allowed"));
    }
  }
});

// Middleware for file upload
exports.uploadMiddleware = upload.single('receipt_image');

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
 * Helper function to create ledger entry for payment
 */
const createPaymentLedgerEntry = async (customerId, paymentId, debitAmount, paymentMethod, description, previousBalance) => {
  const newBalance = parseFloat(previousBalance) - parseFloat(debitAmount);

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
    null, // invoice_id is NULL for payments
    0, // credit_amount is 0 for payments
    debitAmount,
    description || `Payment received via ${paymentMethod}`,
    paymentMethod,
    `PAY-${paymentId}`, // reference number for payment
    newBalance,
    'payment'
  ];

  const [result] = await db.promise().query(query, values);
  return result;
};

/**
 * @desc    Create Payment with Check Status Logic, Bank Transaction AND Ledger Entry
 * @route   POST /api/payments
 * @access  Private
 */
exports.createPayment = asyncHandler(async (req, res) => {
  const {
    customer_id,
    payment_method,
    amount,
    description,
    check_no,
    check_date,
    bank_id
  } = req.body;

  let receiptImage = null;
  if (req.file) {
    receiptImage = req.file.buffer;
    console.log('Receipt image buffer size:', receiptImage.length);
  }

  let status = 'cleared';
  if (payment_method === 'Cheque') {
    status = 'pending';
  }

  // Get connection for transaction
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Get customer's current balance if customer_id exists
    let previousBalance = 0;
    if (customer_id) {
      previousBalance = await getCustomerBalance(customer_id);
      console.log('Customer previous balance:', previousBalance);
    }

    // Insert payment
    let sql = `
      INSERT INTO payments (
        ${customer_id ? 'customer_id,' : ''}
        payment_method,
        status,
        amount, 
        description,
        payment_date,
        created_at
        ${check_no ? ', check_no' : ''}
        ${check_date ? ', check_date' : ''}
        ${receiptImage ? ', receipt_image' : ''}
        ${bank_id ? ', bank_id' : ''}
      ) VALUES (
        ${customer_id ? '?,' : ''}
        ?, ?, ?, ?, NOW(), NOW()
        ${check_no ? ', ?' : ''}
        ${check_date ? ', ?' : ''}
        ${receiptImage ? ', ?' : ''}
        ${bank_id ? ', ?' : ''}
      )
    `;

    let values = [];
    if (customer_id) values.push(customer_id);
    values.push(payment_method, status, amount, description);

    if (check_no) values.push(check_no);
    if (check_date) values.push(new Date(check_date));
    if (receiptImage) values.push(receiptImage);
    if (bank_id) values.push(bank_id);

    const [result] = await connection.query(sql, values);
    const paymentId = result.insertId;

    // Create ledger entry only if customer_id exists and payment is cleared
    if (customer_id && status === 'cleared') {
      await createPaymentLedgerEntry(
        customer_id,
        paymentId,
        amount,
        payment_method,
        description,
        previousBalance
      );
      console.log('Payment ledger entry created successfully');
    }

    // Handle bank transactions if applicable
    if (status === 'cleared' && (payment_method === 'Bank' || payment_method === 'Cheque') && bank_id) {
      const updateBankSql = `
        UPDATE bank_accounts 
        SET balance = balance + ?, updated_at = NOW() 
        WHERE id = ?
      `;

      await connection.query(updateBankSql, [amount, bank_id]);

      const transactionSql = `
        INSERT INTO bank_transactions (bank_id, amount, type, description, created_at)
        VALUES (?, ?, 'cash_in', ?, NOW())
      `;

      const transactionDesc = `Payment from ${customer_id ? 'customer' : 'cash management'} (${payment_method})${description ? ': ' + description : ''}`;

      await connection.query(transactionSql, [bank_id, amount, transactionDesc]);
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    res.status(201).json({
      message: `Payment recorded successfully${status === 'pending' ? ' (Cheque pending clearance)' : ''}`,
      paymentId: paymentId,
      status: status
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error creating payment:", error);
    throw error;
  }
});

/**
 * @desc    Create Cash Entry (for manual cash transactions)
 * @route   POST /api/payments/cash
 * @access  Private
 */
exports.createCashEntry = asyncHandler(async (req, res) => {
  const { amount, description } = req.body;

  if (!amount) {
    throw new AppError("Amount is required", 400);
  }

  const sql = `
    INSERT INTO payments (payment_method, status, amount, description, payment_date, created_at)
    VALUES ('Cash', 'cleared', ?, ?, NOW(), NOW())
  `;

  const [result] = await db.promise().query(sql, [amount, description || null]);

  res.status(201).json({
    message: "Cash entry recorded successfully",
    paymentId: result.insertId,
  });
});

/**
 * @desc    Clear/Update Check Status with Bank Transaction AND Ledger Entry
 * @route   PUT /api/payments/:id/status
 * @access  Private
 */
exports.updateCheckStatus = asyncHandler(async (req, res) => {
  const paymentId = req.params.id;
  const { status } = req.body;

  const [results] = await db.promise().query("SELECT * FROM payments WHERE id = ?", [paymentId]);

  if (results.length === 0) {
    throw new AppError("Payment not found", 404);
  }

  const payment = results[0];
  const oldStatus = payment.status;

  // Get connection for transaction
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Get customer's current balance if customer_id exists
    let previousBalance = 0;
    if (payment.customer_id && oldStatus === 'pending' && status === 'cleared') {
      previousBalance = await getCustomerBalance(payment.customer_id);
      console.log('Customer previous balance before clearing check:', previousBalance);
    }

    // Update payment status
    const updateSql = "UPDATE payments SET status = ? WHERE id = ?";
    await connection.query(updateSql, [status, paymentId]);

    // Create ledger entry when clearing a pending check
    if (payment.customer_id && oldStatus === 'pending' && status === 'cleared') {
      await createPaymentLedgerEntry(
        payment.customer_id,
        paymentId,
        payment.amount,
        payment.payment_method,
        payment.description || `Check cleared (Check #${payment.check_no || 'N/A'})`,
        previousBalance
      );
      console.log('Ledger entry created for cleared check');
    }

    // Handle bank transactions
    if ((payment.payment_method === 'Bank' || payment.payment_method === 'Cheque') && payment.bank_id) {
      let balanceChange = 0;
      let shouldCreateTransaction = false;

      if (oldStatus === 'pending' && status === 'cleared') {
        balanceChange = parseFloat(payment.amount);
        shouldCreateTransaction = true;
      }
      else if (oldStatus === 'cleared' && (status === 'pending' || status === 'cancelled')) {
        balanceChange = -parseFloat(payment.amount);
      }
      else if (oldStatus === 'cancelled' && status === 'cleared') {
        balanceChange = parseFloat(payment.amount);
        shouldCreateTransaction = true;
      }

      if (balanceChange !== 0) {
        const updateBankSql = `
          UPDATE bank_accounts 
          SET balance = balance + ?
          WHERE id = ?
        `;

        await connection.query(updateBankSql, [balanceChange, payment.bank_id]);

        if (shouldCreateTransaction) {
          const transactionSql = `
            INSERT INTO bank_transactions (bank_id, amount, type, description, created_at)
            VALUES (?, ?, 'cash_in', ?, NOW())
          `;

          const transactionDesc = `Cheque cleared (Check #${payment.check_no || 'N/A'})${payment.description ? ': ' + payment.description : ''}`;

          await connection.query(transactionSql, [payment.bank_id, balanceChange, transactionDesc]);
        }
      }
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    res.json({
      message: `Payment status updated to ${status}`,
      paymentId: paymentId,
      oldStatus: oldStatus,
      newStatus: status
    });

  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error("Error updating check status:", error);
    throw error;
  }
});

/**
 * @desc    Get Payments by Customer
 * @route   GET /api/payments/customer/:id
 * @access  Private
 */
exports.getPaymentsByCustomer = asyncHandler(async (req, res) => {
  const customerId = req.params.id;
  const { status } = req.query;

  let sql = `
    SELECT 
      p.*,
      b.bank_code
    FROM payments p
    LEFT JOIN bank_accounts b ON p.bank_id = b.id
    WHERE p.customer_id = ?
  `;

  let values = [customerId];

  if (status) {
    sql += " AND p.status = ?";
    values.push(status);
  }

  sql += " ORDER BY p.payment_date DESC";

  const [results] = await db.promise().query(sql, values);

  const paymentsWithImages = results.map(payment => {
    if (payment.receipt_image) {
      payment.receipt_image = Buffer.from(payment.receipt_image).toString('base64');
    }
    return payment;
  });

  res.json(paymentsWithImages);
});

/**
 * @desc    Get Pending Checks
 * @route   GET /api/payments/pending-checks
 * @access  Private
 */
exports.getPendingChecks = asyncHandler(async (req, res) => {
  const sql = `
    SELECT 
      p.*,
      c.name as customer_name,
      b.bank_code
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN bank_accounts b ON p.bank_id = b.id
    WHERE p.payment_method = 'Cheque' AND p.status = 'pending'
    ORDER BY p.check_date ASC
  `;

  const [results] = await db.promise().query(sql);

  const checksWithImages = results.map(payment => {
    if (payment.receipt_image) {
      payment.receipt_image = Buffer.from(payment.receipt_image).toString('base64');
    }
    return payment;
  });

  res.json(checksWithImages);
});

/**
 * @desc    Get All Payments
 * @route   GET /api/payments
 * @access  Private
 */
exports.getAllPayments = asyncHandler(async (req, res) => {
  const sql = `
    SELECT 
      p.*,
      c.name as customer_name,
      b.bank_code
    FROM payments p
    LEFT JOIN customers c ON p.customer_id = c.id
    LEFT JOIN bank_accounts b ON p.bank_id = b.id
    ORDER BY p.payment_date DESC
  `;

  const [results] = await db.promise().query(sql);

  const paymentsWithImages = results.map(payment => {
    if (payment.receipt_image) {
      payment.receipt_image = Buffer.from(payment.receipt_image).toString('base64');
    }
    return payment;
  });

  res.json(paymentsWithImages);
});

/**
 * @desc    Get Payment Receipt Image
 * @route   GET /api/payments/:id/receipt
 * @access  Private
 */
exports.getReceiptImage = asyncHandler(async (req, res) => {
  const paymentId = req.params.id;

  const [results] = await db.promise().query("SELECT receipt_image FROM payments WHERE id = ?", [paymentId]);

  if (results.length === 0 || !results[0].receipt_image) {
    throw new AppError("Receipt not found", 404);
  }

  const receiptImage = results[0].receipt_image;

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Content-Length', receiptImage.length);
  res.send(receiptImage);
});

/**
 * @desc    Delete Payment with Ledger Entry Removal
 * @route   DELETE /api/payments/:id
 * @access  Private
 */
exports.deletePayment = asyncHandler(async (req, res) => {
  const paymentId = req.params.id;

  const [results] = await db.promise().query("SELECT * FROM payments WHERE id = ?", [paymentId]);

  if (results.length === 0) {
    throw new AppError("Payment not found", 404);
  }

  const payment = results[0];

  // Get connection for transaction
  const connection = await db.promise().getConnection();

  try {
    await connection.beginTransaction();

    // Delete ledger entry if exists
    const deleteLedgerSql = `
      DELETE FROM filledledger 
      WHERE reference_number = ? AND transaction_type = 'payment'
    `;

    await connection.query(deleteLedgerSql, [`PAY-${paymentId}`]);

    // Delete payment
    await connection.query("DELETE FROM payments WHERE id = ?", [paymentId]);

    // Update bank balance if needed
    if (payment.status === 'cleared' && payment.payment_method === 'Bank' && payment.bank_id) {
      const updateBankSql = `
        UPDATE bank_accounts 
        SET balance = balance - ?
        WHERE id = ?
      `;
      await connection.query(updateBankSql, [payment.amount, payment.bank_id]);
    }

    // Commit transaction
    await connection.commit();
    connection.release();

    res.json({ message: "Payment and related ledger entry deleted successfully" });

  } catch (error) {
    await connection.rollback();
    connection.release();
    throw error;
  }
});

/**
 * @desc    Update Payment
 * @route   PUT /api/payments/:id
 * @access  Private
 */
exports.updatePayment = [
  upload.single('receipt_image'),
  asyncHandler(async (req, res) => {
    const paymentId = req.params.id;
    const { payment_method, amount, description, check_no, check_date, status } = req.body;

    let receiptImage = null;
    if (req.file) {
      receiptImage = req.file.buffer;
    }

    let sql = `
      UPDATE payments SET 
        payment_method = ?, 
        amount = ?, 
        description = ?
        ${status ? ', status = ?' : ''}
        ${check_no ? ', check_no = ?' : ''}
        ${check_date ? ', check_date = ?' : ''}
        ${receiptImage ? ', receipt_image = ?' : ''}
      WHERE id = ?
    `;

    let values = [payment_method, amount, description];
    if (status) values.push(status);
    if (check_no) values.push(check_no);
    if (check_date) values.push(new Date(check_date));
    if (receiptImage) values.push(receiptImage);
    values.push(paymentId);

    const [result] = await db.promise().query(sql, values);

    if (result.affectedRows === 0) {
      throw new AppError("Payment not found", 404);
    }

    res.json({ message: "Payment updated successfully" });
  })
];