const { CashManagement } = require('../models');
const { Op } = require('sequelize');

/**
 * Create New Cash Management Transaction
 */
exports.createCashTransaction = async (req, res) => {
  const { payment_method, amount, type, description } = req.body;

  if (!payment_method || !amount || !type) {
    return res.status(400).json({
      error: 'Missing required fields',
      received: { payment_method, amount, type }
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  if (!['cash_in', 'cash_out'].includes(type)) {
    return res.status(400).json({ error: 'Type must be cash_in or cash_out' });
  }

  if (!['Cash', 'Online', 'Slip'].includes(payment_method)) {
    return res.status(400).json({ error: 'Payment method must be Cash, Online, or Slip' });
  }

  try {
    const transaction = await CashManagement.create({
      payment_method,
      amount,
      type,
      description: description || null
    });

    res.status(201).json({
      id: transaction.id,
      message: 'Transaction created successfully'
    });
  } catch (error) {
    console.error('Insert transaction error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * Get All Transactions (grouped by payment method)
 */
exports.getAllCashTransactions = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const where = {};

    // Add date range filter if provided
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    }

    const transactions = await CashManagement.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    // Group by payment method
    const cash = transactions.filter(t => t.payment_method === 'Cash');
    const online = transactions.filter(t => t.payment_method === 'Online');
    const slip = transactions.filter(t => t.payment_method === 'Slip');

    res.json({
      cash: cash.map(t => ({ ...t.toJSON(), amount: parseFloat(t.amount) || 0 })),
      online: online.map(t => ({ ...t.toJSON(), amount: parseFloat(t.amount) || 0 })),
      slip: slip.map(t => ({ ...t.toJSON(), amount: parseFloat(t.amount) || 0 })),
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get Transactions by Payment Method
 */
exports.getTransactionsByMethod = async (req, res) => {
  const { method } = req.params;
  const { startDate, endDate } = req.query;

  if (!['Cash', 'Online', 'Slip'].includes(method)) {
    return res.status(400).json({ error: 'Invalid payment method' });
  }

  try {
    const where = { payment_method: method };

    // Add date range filter if provided
    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    }

    const transactions = await CashManagement.findAll({
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      transactions: transactions.map(t => ({
        ...t.toJSON(),
        amount: parseFloat(t.amount) || 0
      }))
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update Transaction
 */
exports.updateCashTransaction = async (req, res) => {
  const { id } = req.params;
  const { amount, description } = req.body;

  if (!amount || typeof amount !== 'number') {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const [updated] = await CashManagement.update(
      { amount, description },
      { where: { id } }
    );

    if (updated === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction updated successfully' });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Delete Transaction
 */
exports.deleteCashTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await CashManagement.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get Summary Statistics
 */
exports.getSummaryStats = async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    const where = {};

    if (startDate && endDate) {
      where.created_at = {
        [Op.between]: [new Date(startDate), new Date(endDate + ' 23:59:59')]
      };
    }

    const transactions = await CashManagement.findAll({ where });

    const summary = {
      cash: { total_in: 0, total_out: 0, balance: 0 },
      online: { total_in: 0, total_out: 0, balance: 0 },
      slip: { total_in: 0, total_out: 0, balance: 0 }
    };

    transactions.forEach(t => {
      const method = t.payment_method.toLowerCase();
      const amount = parseFloat(t.amount) || 0;

      if (t.type === 'cash_in') {
        summary[method].total_in += amount;
      } else {
        summary[method].total_out += amount;
      }
      summary[method].balance = summary[method].total_in - summary[method].total_out;
    });

    res.json(summary);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
