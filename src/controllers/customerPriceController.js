const { CustomerItemPrice, Customer, Item } = require('../models');

/**
 * Set custom price for customer-item (upsert operation)
 */
exports.setCustomerItemPrice = async (req, res) => {
  const { customer_id, item_id, custom_price } = req.body;

  if (customer_id == null || item_id == null || custom_price == null) {
    return res.status(400).json({ error: 'Customer ID, Item ID, and custom price are required' });
  }

  try {
    // Use Sequelize upsert (INSERT ... ON DUPLICATE KEY UPDATE)
    await CustomerItemPrice.upsert({
      customer_id,
      item_id,
      custom_price
    });

    res.json({ message: 'Custom price set successfully' });
  } catch (error) {
    console.error('Error setting price:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Get custom price for a customer-item
 */
exports.getCustomerItemPrice = async (req, res) => {
  const { customer_id, item_id } = req.params;

  try {
    const priceRecord = await CustomerItemPrice.findOne({
      where: { customer_id, item_id },
      include: [
        {
          model: Customer,
          as: 'customer',
          attributes: ['name']
        },
        {
          model: Item,
          as: 'item',
          attributes: ['name', 'sale_price']
        }
      ]
    });

    if (!priceRecord) {
      return res.status(404).json({ error: 'Custom price not found' });
    }

    const response = {
      custom_price: priceRecord.custom_price,
      customer_name: priceRecord.customer.name,
      item_name: priceRecord.item.name,
      default_price: priceRecord.item.sale_price
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching custom price:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Get all custom prices for a customer
 */
exports.getCustomerPrices = async (req, res) => {
  const { customer_id } = req.params;

  try {
    const prices = await CustomerItemPrice.findAll({
      where: { customer_id },
      include: [
        {
          model: Item,
          as: 'item',
          attributes: ['name', 'sale_price']
        }
      ],
      order: [[{ model: Item, as: 'item' }, 'name', 'ASC']]
    });

    const formattedPrices = prices.map(p => ({
      id: p.id,
      item_id: p.item_id,
      custom_price: p.custom_price,
      item_name: p.item.name,
      default_price: p.item.sale_price
    }));

    res.json(formattedPrices);
  } catch (error) {
    console.error('Error fetching customer prices:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Update a custom price
 */
exports.updateCustomerItemPrice = async (req, res) => {
  const { customer_id, item_id } = req.params;
  const { custom_price } = req.body;

  if (!custom_price) {
    return res.status(400).json({ error: 'Custom price is required' });
  }

  try {
    const [updated] = await CustomerItemPrice.update(
      { custom_price },
      { where: { customer_id, item_id } }
    );

    if (updated === 0) {
      return res.status(404).json({ error: 'Custom price not found' });
    }

    res.json({ message: 'Custom price updated successfully' });
  } catch (error) {
    console.error('Error updating custom price:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Delete a custom price
 */
exports.deleteCustomerItemPrice = async (req, res) => {
  const { customer_id, item_id } = req.params;

  try {
    const deleted = await CustomerItemPrice.destroy({
      where: { customer_id, item_id }
    });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Custom price not found' });
    }

    res.json({ message: 'Custom price deleted successfully' });
  } catch (error) {
    console.error('Error deleting custom price:', error);
    res.status(500).json({ error: 'Database error' });
  }
};
