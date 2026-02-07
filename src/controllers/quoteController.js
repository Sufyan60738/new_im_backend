const { Quote, QuoteItem, sequelize } = require('../models');

/**
 * Create quote with items
 */
exports.createQuote = async (req, res) => {
  const {
    customer_name,
    quote_to,
    quote_number,
    date,
    total,
    payments_applied,
    balance_due,
    items
  } = req.body;

  const transaction = await sequelize.transaction();

  try {
    // Create quote
    const quote = await Quote.create({
      customer_name,
      quote_to,
      quote_number,
      date,
      total,
      payments_applied,
      balance_due
    }, { transaction });

    // Create quote items
    if (items && items.length > 0) {
      const quoteItems = items.map(item => ({
        quote_id: quote.id,
        item_description: item.description,
        qty: item.qty,
        rate: item.rate,
        unit: item.unit,
        amount: item.amount,
        tax: item.tax
      }));

      await QuoteItem.bulkCreate(quoteItems, { transaction });
    }

    await transaction.commit();

    res.status(201).json({
      message: 'Quote saved successfully',
      quoteId: quote.id
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating quote:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get the last quote number
 */
exports.getLastQuoteNumber = async (req, res) => {
  try {
    const lastQuote = await Quote.findOne({
      order: [['id', 'DESC']],
      attributes: ['quote_number']
    });

    if (!lastQuote) {
      return res.status(200).send('0'); // No quotes yet, start from 1
    }

    const lastQuoteNumber = lastQuote.quote_number;
    const numberOnly = parseInt(lastQuoteNumber.replace(/[^\d]/g, ''), 10);

    res.status(200).send(numberOnly.toString());
  } catch (error) {
    console.error('Error fetching last quote number:', error);
    res.status(500).json({ error: error.message });
  }
};
