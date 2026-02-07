const { Vendor } = require('../models');

/**
 * Add Vendor
 */
exports.addVendor = async (req, res) => {
  const { name, address, phone_number } = req.body;

  if (!name || !address || !phone_number) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newVendor = await Vendor.create({
      name,
      address,
      phone_number
    });

    res.status(201).json(newVendor);
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get All Vendors
 */
exports.getVendors = async (req, res) => {
  try {
    const vendors = await Vendor.findAll({
      order: [['name', 'ASC']]
    });
    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update Vendor
 */
exports.updateVendor = async (req, res) => {
  const { id } = req.params;
  const { name, address, phone_number } = req.body;

  if (!name || !address || !phone_number) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const [updated] = await Vendor.update(
      { name, address, phone_number },
      { where: { id } }
    );

    if (updated === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const updatedVendor = await Vendor.findByPk(id);
    res.status(200).json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Delete Vendor
 */
exports.deleteVendor = async (req, res) => {
  const { id } = req.params;

  try {
    const deleted = await Vendor.destroy({ where: { id } });

    if (deleted === 0) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.status(200).json({
      message: 'Vendor deleted successfully',
      id: parseInt(id)
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: error.message });
  }
};
