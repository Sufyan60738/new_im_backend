const { BankAccount } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { AppError } = require('../middleware/errorHandler');

/**
 * @desc    Get all banks
 * @route   GET /api/bank
 * @access  Private
 */
exports.getAllBanks = asyncHandler(async (req, res) => {
  const banks = await BankAccount.findAll({
    order: [['bank_code', 'ASC']]
  });
  res.json(banks);
});

/**
 * @desc    Get bank by ID
 * @route   GET /api/bank/:id
 * @access  Private
 */
exports.getBankById = asyncHandler(async (req, res) => {
  const bankId = req.params.id;

  const bank = await BankAccount.findByPk(bankId);

  if (!bank) {
    throw new AppError('Bank not found', 404);
  }

  res.json(bank);
});

/**
 * @desc    Create new bank
 * @route   POST /api/bank
 * @access  Private
 */
exports.createBank = asyncHandler(async (req, res) => {
  const { bank_code, initial_balance } = req.body;

  if (!bank_code) {
    throw new AppError('Bank code is required', 400);
  }

  const balance = initial_balance || 0.00;

  const newBank = await BankAccount.create({
    bank_code,
    initial_balance: balance,
    balance: balance
  });

  res.status(201).json({
    message: 'Bank created successfully',
    bankId: newBank.id
  });
});

/**
 * @desc    Update bank
 * @route   PUT /api/bank/:id
 * @access  Private
 */
exports.updateBank = asyncHandler(async (req, res) => {
  const bankId = req.params.id;
  const { bank_code, initial_balance } = req.body;

  const [updated] = await BankAccount.update(
    { bank_code, initial_balance },
    { where: { id: bankId } }
  );

  if (updated === 0) {
    throw new AppError('Bank not found', 404);
  }

  res.json({ message: 'Bank updated successfully' });
});

/**
 * @desc    Delete bank
 * @route   DELETE /api/bank/:id
 * @access  Private
 */
exports.deleteBank = asyncHandler(async (req, res) => {
  const bankId = req.params.id;

  const deleted = await BankAccount.destroy({
    where: { id: bankId }
  });

  if (deleted === 0) {
    throw new AppError('Bank not found', 404);
  }

  res.json({ message: 'Bank deleted successfully' });
});

/**
 * @desc    Get bank balance
 * @route   GET /api/bank/:id/balance
 * @access  Private
 */
exports.getBankBalance = asyncHandler(async (req, res) => {
  const bankId = req.params.id;

  const bank = await BankAccount.findByPk(bankId, {
    attributes: ['balance']
  });

  if (!bank) {
    throw new AppError('Bank not found', 404);
  }

  res.json({ balance: bank.balance });
});
