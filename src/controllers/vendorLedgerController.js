// controllers/vendorLedgerController.js
const db = require('../config/db');

// Get all vendor ledger summaries
exports.getVendorLedgerSummaries = (req, res) => {
  const query = `
    SELECT 
      v.id as vendor_id,
      v.name as vendor_name,
      v.phone_number,
      COALESCE(
        (SELECT SUM(grand_total) FROM purchase_orders WHERE vendor_name = v.name AND status = 'received'),
        0
      ) as total_credit,
      COALESCE(
        
      (SELECT SUM(amount) FROM vendor_payments WHERE vendor_id = v.id),
        0
      ) as total_debit,
      (
        COALESCE((SELECT SUM(grand_total) FROM purchase_orders WHERE vendor_name = v.name AND status = 'received'), 0) -
        COALESCE((SELECT SUM(amount) FROM vendor_payments WHERE vendor_id = v.id), 0)
      ) as balance
    FROM vendors v
    ORDER BY v.name ASC
  `;

  console.log('📋 Fetching vendor ledger summaries...');

  db.query(query, (err, results) => {
    if (err) {
      console.error('❌ Error fetching vendor ledger summaries:', err);
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    
    console.log('✅ Found vendors:', results.length);
    console.log('📊 Sample:', results[0]);
    
    res.json(results);
  });
};

// Get detailed ledger for a specific vendor
exports.getVendorLedgerDetail = (req, res) => {
  const { vendorId } = req.params;
  const { start_date, end_date } = req.query;

  // First, get vendor details
  const vendorQuery = 'SELECT * FROM vendors WHERE id = ?';

  db.query(vendorQuery, [vendorId], (err, vendorResults) => {
    if (err) {
      console.error('Error fetching vendor:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (vendorResults.length === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const vendor = vendorResults[0];

    // Build transactions query with optional date filtering
    // Using GROUP_CONCAT instead of JSON_ARRAYAGG for MySQL 5.6 compatibility
    let transactionsQuery = `
      SELECT 
        po.id as po_id,
        po.order_date as date,
        CONCAT('Purchase Order #', po.id, ' - ', po.vendor_name) as details,
        'PURCHASE' as type,
        'invoice' as payment_method,
        '-' as bank,
        0 as debit,
        po.grand_total as credit,
        'PO' as source_type
      FROM purchase_orders po
      WHERE po.vendor_name = ? AND po.status = 'received'
    `;

    const queryParams = [vendor.name];

    if (start_date && end_date) {
      transactionsQuery += ` AND po.order_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    transactionsQuery += `
      UNION ALL
      
      SELECT 
        vp.id as po_id,
        vp.payment_date as date,
        CONCAT('Payment received via ', vp.payment_method) as details,
        'PAYMENT' as type,
        vp.payment_method,
        COALESCE(vp.bank_name, '-') as bank,
        vp.amount as debit,
        0 as credit,
        'PAYMENT' as source_type
      FROM vendor_payments vp
      WHERE vp.vendor_id = ?
    `;

    queryParams.push(vendorId);

    if (start_date && end_date) {
      transactionsQuery += ` AND vp.payment_date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }

    transactionsQuery += ' ORDER BY date ASC, type DESC';

    console.log('🔍 Fetching transactions for vendor:', vendor.name);
    console.log('📋 Query params:', queryParams);

    db.query(transactionsQuery, queryParams, (err, transactions) => {
      if (err) {
        console.error('Error fetching transactions:', err);
        return res.status(500).json({ error: 'Database error', details: err.message });
      }

      console.log('✅ Found transactions:', transactions.length);

      // Get items for each purchase order
      const poIds = transactions
        .filter(t => t.source_type === 'PO')
        .map(t => t.po_id);

      if (poIds.length === 0) {
        // No purchase orders, just payments
        const processedTransactions = processTransactions(transactions);
        return res.json({
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          phone_number: vendor.phone_number,
          address: vendor.address,
          total_debit: processedTransactions.totalDebit,
          total_credit: processedTransactions.totalCredit,
          net_balance: processedTransactions.netBalance,
          transactions: processedTransactions.transactions
        });
      }

      // Fetch items for purchase orders
      const itemsQuery = `
        SELECT 
          purchase_order_id,
          item_name,
          quantity,
          purchase_price,
          total_price
        FROM purchase_order_items
        WHERE purchase_order_id IN (?)
      `;

      db.query(itemsQuery, [poIds], (err, items) => {
        if (err) {
          console.error('Error fetching items:', err);
        }

        // Group items by purchase_order_id
        const itemsByPO = {};
        if (items && items.length > 0) {
          items.forEach(item => {
            if (!itemsByPO[item.purchase_order_id]) {
              itemsByPO[item.purchase_order_id] = [];
            }
            itemsByPO[item.purchase_order_id].push({
              item_name: item.item_name,
              quantity: item.quantity,
              purchase_price: item.purchase_price,
              total_price: item.total_price
            });
          });
        }

        // Add items to transactions
        transactions.forEach(t => {
          if (t.source_type === 'PO' && itemsByPO[t.po_id]) {
            t.items_json = JSON.stringify(itemsByPO[t.po_id]);
          } else {
            t.items_json = null;
          }
        });

        const processedTransactions = processTransactions(transactions);

        console.log('📊 Summary:', {
          totalDebit: processedTransactions.totalDebit,
          totalCredit: processedTransactions.totalCredit,
          netBalance: processedTransactions.netBalance,
          transactionCount: processedTransactions.transactions.length
        });

        res.json({
          vendor_id: vendor.id,
          vendor_name: vendor.name,
          phone_number: vendor.phone_number,
          address: vendor.address,
          total_debit: processedTransactions.totalDebit,
          total_credit: processedTransactions.totalCredit,
          net_balance: processedTransactions.netBalance,
          transactions: processedTransactions.transactions
        });
      });
    });
  });
};

// Helper function to process transactions
function processTransactions(transactions) {
  let runningBalance = 0;
  let totalDebit = 0;
  let totalCredit = 0;

  const processedTransactions = transactions.map(t => {
    const debit = parseFloat(t.debit || 0);
    const credit = parseFloat(t.credit || 0);
    
    totalDebit += debit;
    totalCredit += credit;
    runningBalance = totalCredit - totalDebit;

    return {
      date: t.date,
      details: t.details,
      type: t.type,
      payment_method: t.payment_method,
      bank: t.bank,
      debit: debit,
      credit: credit,
      balance: runningBalance,
      items_json: t.items_json
    };
  });

  // Reverse to show most recent first
  processedTransactions.reverse();

  return {
    totalDebit,
    totalCredit,
    netBalance: runningBalance,
    transactions: processedTransactions
  };
}

// Add payment to vendor
exports.addVendorPayment = (req, res) => {
  const { vendor_id, amount, payment_date, payment_method, bank_name, notes } = req.body;

  if (!vendor_id || !amount || !payment_date || !payment_method) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const query = `
    INSERT INTO vendor_payments (vendor_id, amount, payment_date, payment_method, bank_name, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [vendor_id, amount, payment_date, payment_method, bank_name, notes], (err, result) => {
    if (err) {
      console.error('Error adding vendor payment:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    res.status(201).json({
      message: 'Payment added successfully',
      id: result.insertId
    });
  });
};

// Get vendor payments
exports.getVendorPayments = (req, res) => {
  const { vendorId } = req.params;

  const query = `
    SELECT 
      vp.*,
      v.name as vendor_name
    FROM vendor_payments vp
    JOIN vendors v ON vp.vendor_id = v.id
    WHERE vp.vendor_id = ?
    ORDER BY vp.payment_date DESC
  `;

  db.query(query, [vendorId], (err, results) => {
    if (err) {
      console.error('Error fetching vendor payments:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Delete vendor payment
exports.deleteVendorPayment = (req, res) => {
  const { id } = req.params;

  const query = 'DELETE FROM vendor_payments WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting vendor payment:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({ message: 'Payment deleted successfully' });
  });
};