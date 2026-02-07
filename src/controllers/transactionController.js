const db = require('../config/db');

// 🔹 Create New Transaction
exports.createTransaction = (req, res) => {
  console.log('Request body:', req.body); // Debug log
  
  if (!req.body) {
    return res.status(400).json({ error: 'Request body is missing' });
  }

  const { bankId, amount, type, description } = req.body;

  if (!bankId || !amount || !type) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      received: { bankId, amount, type, description }
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (!['cash_in', 'cash_out'].includes(type)) {
    return res.status(400).json({ error: 'Type must be cash_in or cash_out' });
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Transaction start error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // Insert transaction record
    const insertTransactionSql = `
      INSERT INTO bank_transactions (bank_id, amount, type, description) 
      VALUES (?, ?, ?, ?)
    `;
    
    db.query(insertTransactionSql, [bankId, amount, type, description || null], (err, result) => {
      if (err) {
        console.error('Insert transaction error:', err);
        return db.rollback(() => {
          res.status(500).json({ error: 'Server error' });
        });
      }

      // Update bank balance
      const balanceChange = type === 'cash_in' ? amount : -amount;
      const updateBalanceSql = `
        UPDATE bank_accounts 
        SET balance = balance + ? 
        WHERE id = ?
      `;

      db.query(updateBalanceSql, [balanceChange, bankId], (err, updateResult) => {
        if (err) {
          console.error('Update balance error:', err);
          return db.rollback(() => {
            res.status(500).json({ error: 'Server error' });
          });
        }

        if (updateResult.affectedRows === 0) {
          return db.rollback(() => {
            res.status(404).json({ error: 'Bank not found' });
          });
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            console.error('Commit error:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Server error' });
            });
          }
          
          res.status(201).json({ 
            id: result.insertId, 
            message: 'Transaction created successfully' 
          });
        });
      });
    });
  });
};

// 🔹 Get All Transactions for a Bank (with optional date filter)
exports.getBankTransactions = (req, res) => {
  const { bankId } = req.params;
  const { startDate, endDate } = req.query;

  let sql = `
    SELECT t.*, b.balance as current_bank_balance 
    FROM bank_transactions t
    LEFT JOIN bank_accounts b ON t.bank_id = b.id
    WHERE t.bank_id = ?
  `;
  let params = [bankId];

  // Add date range filter if provided
  if (startDate && endDate) {
    sql += ` AND DATE(t.created_at) BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  sql += ` ORDER BY t.created_at DESC`;

  db.query(sql, params, (err, transactions) => {
    if (err) {
      console.error('Get transactions error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    // Calculate remaining balance based on filtered transactions
    let remainingBalance = 0;
    if (transactions.length > 0) {
      remainingBalance = parseFloat(transactions[0].current_bank_balance) || 0;
    } else {
      // If no transactions, get current bank balance
      const balanceQuery = 'SELECT balance FROM bank_accounts WHERE id = ?';
      db.query(balanceQuery, [bankId], (err, balanceResult) => {
        if (err) {
          console.error('Get balance error:', err);
          return res.status(500).json({ error: 'Server error' });
        }
        
        remainingBalance = balanceResult.length > 0 ? parseFloat(balanceResult[0].balance) || 0 : 0;
        
        return res.json({
          transactions: transactions.map(t => ({
            ...t,
            amount: parseFloat(t.amount) || 0
          })),
          remainingBalance: remainingBalance
        });
      });
      return;
    }

    res.json({
      transactions: transactions.map(t => ({
        ...t,
        amount: parseFloat(t.amount) || 0
      })),
      remainingBalance: remainingBalance
    });
  });
};

// 🔹 Update Transaction
exports.updateTransaction = (req, res) => {
  const { id } = req.params;
  const { amount, description } = req.body;

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // Get old transaction data first
  const getOldSql = 'SELECT * FROM bank_transactions WHERE id = ?';
  
  db.query(getOldSql, [id], (err, oldData) => {
    if (err) {
      console.error('Get old transaction error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (oldData.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const oldTransaction = oldData[0];
    const oldAmount = oldTransaction.amount;
    const transactionType = oldTransaction.type;
    const bankId = oldTransaction.bank_id;

    // Start database transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error('Transaction start error:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      // Update transaction record
      const updateTransactionSql = `
        UPDATE bank_transactions 
        SET amount = ?, description = ? 
        WHERE id = ?
      `;

      db.query(updateTransactionSql, [amount, description, id], (err, result) => {
        if (err) {
          console.error('Update transaction error:', err);
          return db.rollback(() => {
            res.status(500).json({ error: 'Server error' });
          });
        }

        // Calculate balance adjustment
        const oldBalanceEffect = transactionType === 'cash_in' ? -oldAmount : oldAmount;
        const newBalanceEffect = transactionType === 'cash_in' ? amount : -amount;
        const totalBalanceChange = oldBalanceEffect + newBalanceEffect;

        // Update bank balance
        const updateBalanceSql = `
          UPDATE bank_accounts 
          SET balance = balance + ? 
          WHERE id = ?
        `;

        db.query(updateBalanceSql, [totalBalanceChange, bankId], (err, updateResult) => {
          if (err) {
            console.error('Update balance error:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Server error' });
            });
          }

          // Commit transaction
          db.commit((err) => {
            if (err) {
              console.error('Commit error:', err);
              return db.rollback(() => {
                res.status(500).json({ error: 'Server error' });
              });
            }
            
            res.json({ message: 'Transaction updated successfully' });
          });
        });
      });
    });
  });
};

// 🔹 Delete Transaction
exports.deleteTransaction = (req, res) => {
  const { id } = req.params;

  // Get transaction data first
  const getTransactionSql = 'SELECT * FROM bank_transactions WHERE id = ?';
  
  db.query(getTransactionSql, [id], (err, transactionData) => {
    if (err) {
      console.error('Get transaction error:', err);
      return res.status(500).json({ error: 'Server error' });
    }

    if (transactionData.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    const transaction = transactionData[0];
    const amount = transaction.amount;
    const type = transaction.type;
    const bankId = transaction.bank_id;

    // Start database transaction
    db.beginTransaction((err) => {
      if (err) {
        console.error('Transaction start error:', err);
        return res.status(500).json({ error: 'Server error' });
      }

      // Delete transaction record
      const deleteTransactionSql = 'DELETE FROM bank_transactions WHERE id = ?';
      
      db.query(deleteTransactionSql, [id], (err, result) => {
        if (err) {
          console.error('Delete transaction error:', err);
          return db.rollback(() => {
            res.status(500).json({ error: 'Server error' });
          });
        }

        // Reverse the balance effect
        const balanceChange = type === 'cash_in' ? -amount : amount;
        const updateBalanceSql = `
          UPDATE bank_accounts 
          SET balance = balance + ? 
          WHERE id = ?
        `;

        db.query(updateBalanceSql, [balanceChange, bankId], (err, updateResult) => {
          if (err) {
            console.error('Update balance error:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Server error' });
            });
          }

          // Commit transaction
          db.commit((err) => {
            if (err) {
              console.error('Commit error:', err);
              return db.rollback(() => {
                res.status(500).json({ error: 'Server error' });
              });
            }
            
            res.json({ message: 'Transaction deleted successfully' });
          });
        });
      });
    });
  });
};