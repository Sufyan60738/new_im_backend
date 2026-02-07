// controllers/purchaseOrderController.js
const db = require('../config/db');

// Create Purchase Order
exports.createPurchaseOrder = (req, res) => {
  const { vendor_name, order_date, expected_delivery, notes, items } = req.body;

  console.log('Received PO request:', req.body);

  if (!vendor_name || !order_date || !items || items.length === 0) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Calculate totals
  let subtotal = 0;
  items.forEach(item => {
    subtotal += parseFloat(item.quantity) * parseFloat(item.purchase_price);
  });

  console.log('Calculated subtotal:', subtotal);

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Transaction error' });
    }

    // Insert purchase order
    const poQuery = `
      INSERT INTO purchase_orders (vendor_name, order_date, expected_delivery, notes, subtotal, grand_total)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    db.query(poQuery, [vendor_name, order_date, expected_delivery, notes, subtotal, subtotal], 
      (err, poResult) => {
        if (err) {
          console.error('Error creating purchase order:', err);
          return db.rollback(() => {
            res.status(500).json({ error: 'Database error', details: err.message });
          });
        }

        const purchaseOrderId = poResult.insertId;
        console.log('Created PO with ID:', purchaseOrderId);

        // Process items sequentially
        const processItem = (index) => {
          if (index >= items.length) {
            // All items processed successfully
            db.commit((err) => {
              if (err) {
                console.error('Error committing transaction:', err);
                return db.rollback(() => {
                  res.status(500).json({ error: 'Transaction commit failed' });
                });
              }

              console.log('✅ PO created successfully');
              res.status(201).json({ 
                message: 'Purchase order created successfully', 
                id: purchaseOrderId 
              });
            });
            return;
          }

          const item = items[index];
          const totalPrice = parseFloat(item.quantity) * parseFloat(item.purchase_price);
          
          // Insert purchase order item
          const itemQuery = `
            INSERT INTO purchase_order_items (purchase_order_id, item_id, item_name, quantity, purchase_price, total_price)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          db.query(itemQuery, 
            [purchaseOrderId, item.item_id, item.item_name, item.quantity, item.purchase_price, totalPrice],
            (err, itemResult) => {
              if (err) {
                console.error('Error inserting item:', err);
                return db.rollback(() => {
                  res.status(500).json({ error: 'Failed to insert item', details: err.message });
                });
              }

              console.log(`✅ Item ${index + 1} inserted: ${item.item_name}`);

              // Update item quantity in items table
              const updateItemQuery = `
                UPDATE items 
                SET qty_on_hand = qty_on_hand + ?,
                    cost_price = ?
                WHERE id = ?
              `;

              db.query(updateItemQuery, [item.quantity, item.purchase_price, item.item_id],
                (err, updateResult) => {
                  if (err) {
                    console.error('Error updating item quantity:', err);
                    return db.rollback(() => {
                      res.status(500).json({ error: 'Failed to update inventory', details: err.message });
                    });
                  }

                  console.log(`✅ Inventory updated for: ${item.item_name} (+${item.quantity})`);

                  // Process next item
                  processItem(index + 1);
                });
            });
        };

        // Start processing items
        processItem(0);
      });
  });
};

// Get All Purchase Orders
exports.getPurchaseOrders = (req, res) => {
  const query = `
    SELECT 
      po.*,
      COUNT(poi.id) as item_count
    FROM purchase_orders po
    LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
    GROUP BY po.id
    ORDER BY po.order_date DESC, po.id DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching purchase orders:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Get Single Purchase Order with Items
exports.getPurchaseOrderById = (req, res) => {
  const { id } = req.params;

  const poQuery = 'SELECT * FROM purchase_orders WHERE id = ?';
  const itemsQuery = 'SELECT * FROM purchase_order_items WHERE purchase_order_id = ?';

  db.query(poQuery, [id], (err, poResults) => {
    if (err) {
      console.error('Error fetching purchase order:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (poResults.length === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    db.query(itemsQuery, [id], (err, itemResults) => {
      if (err) {
        console.error('Error fetching purchase order items:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({
        ...poResults[0],
        items: itemResults
      });
    });
  });
};

// Get Item Purchase History
exports.getItemPurchaseHistory = (req, res) => {
  const { itemId } = req.params;

  const query = `
    SELECT 
      poi.*,
      po.vendor_name,
      po.order_date,
      po.expected_delivery,
      po.status,
      po.id as purchase_order_id
    FROM purchase_order_items poi
    JOIN purchase_orders po ON poi.purchase_order_id = po.id
    WHERE poi.item_id = ?
    ORDER BY po.order_date DESC
  `;

  db.query(query, [itemId], (err, results) => {
    if (err) {
      console.error('Error fetching item purchase history:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
};

// Update Purchase Order Status
exports.updatePurchaseOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'received', 'cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const query = 'UPDATE purchase_orders SET status = ? WHERE id = ?';

  db.query(query, [status, id], (err, result) => {
    if (err) {
      console.error('Error updating purchase order status:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Purchase order not found' });
    }

    res.json({ message: 'Purchase order status updated successfully' });
  });
};

// Delete Purchase Order
exports.deletePurchaseOrder = (req, res) => {
  const { id } = req.params;

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ error: 'Transaction error' });
    }

    // Get items before deleting to revert quantities
    const getItemsQuery = 'SELECT item_id, quantity FROM purchase_order_items WHERE purchase_order_id = ?';
    
    db.query(getItemsQuery, [id], (err, items) => {
      if (err) {
        console.error('Error fetching items for deletion:', err);
        return db.rollback(() => {
          res.status(500).json({ error: 'Database error' });
        });
      }

      if (items.length === 0) {
        // No items, just delete the order
        const deleteQuery = 'DELETE FROM purchase_orders WHERE id = ?';
        db.query(deleteQuery, [id], (err, result) => {
          if (err) {
            console.error('Error deleting purchase order:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Database error' });
            });
          }

          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                res.status(500).json({ error: 'Transaction commit failed' });
              });
            }
            res.json({ message: 'Purchase order deleted successfully' });
          });
        });
        return;
      }

      // Revert item quantities
      const processItemRevert = (index) => {
        if (index >= items.length) {
          // All items reverted, now delete the PO
          const deleteQuery = 'DELETE FROM purchase_orders WHERE id = ?';
          db.query(deleteQuery, [id], (err, result) => {
            if (err) {
              console.error('Error deleting purchase order:', err);
              return db.rollback(() => {
                res.status(500).json({ error: 'Database error' });
              });
            }

            if (result.affectedRows === 0) {
              return db.rollback(() => {
                res.status(404).json({ error: 'Purchase order not found' });
              });
            }

            db.commit((err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: 'Transaction commit failed' });
                });
              }
              res.json({ message: 'Purchase order deleted successfully' });
            });
          });
          return;
        }

        const item = items[index];
        const updateQuery = 'UPDATE items SET qty_on_hand = qty_on_hand - ? WHERE id = ?';
        
        db.query(updateQuery, [item.quantity, item.item_id], (err) => {
          if (err) {
            console.error('Error updating item quantity:', err);
            return db.rollback(() => {
              res.status(500).json({ error: 'Failed to revert inventory' });
            });
          }

          // Process next item
          processItemRevert(index + 1);
        });
      };

      // Start reverting items
      processItemRevert(0);
    });
  });
};