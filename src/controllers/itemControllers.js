// copy
const db = require('../config/db');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File info:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      fieldname: file.fieldname
    });

    // More comprehensive file type checking
    const allowedTypes = /jpeg|jpg|png|gif|webp|bmp|tiff/i;
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/bmp',
      'image/tiff'
    ];

    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.includes(file.mimetype.toLowerCase());

    console.log('File validation:', {
      extname: extname,
      mimetype: mimetype,
      actualMimetype: file.mimetype
    });

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      console.log('File rejected - Extension valid:', extname, 'MIME type valid:', mimetype);
      return cb(new Error("Only image files are allowed"));
    }
  }
});

// Alternative simpler fileFilter (use this if above doesn't work)
const uploadSimple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('File received:', file.originalname, 'MIME:', file.mimetype);
    
    // Just check if it starts with image/
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});

// ✅ Create Item with Image
exports.createItem = [
  upload.single('item_picture'), // Try changing this to uploadSimple.single('item_picture') if issues persist
  (req, res) => {
    console.log('Create item request received');
    console.log('Body:', req.body);
    console.log('File:', req.file ? 'File present' : 'No file');

    const { name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description } = req.body;

    if (!name || !cost_price || !sale_price) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const imageBuffer = req.file ? req.file.buffer : null;
    console.log('Image buffer size:', imageBuffer ? imageBuffer.length : 0);

    const query = `
      INSERT INTO items (name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description, item_picture)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const values = [name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description, imageBuffer];

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error inserting item:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      console.log('Item created successfully with ID:', result.insertId);
      res.status(201).json({ message: 'Item saved successfully', id: result.insertId });
    });
  }
];

// Rest of your code remains the same...
exports.getItems = (req, res) => {
  const query = 'SELECT id, name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description, created_at, item_picture FROM items ORDER BY id DESC';

  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching items:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const itemsWithImages = results.map(item => {
      if (item.item_picture) {
        item.item_picture = Buffer.from(item.item_picture).toString('base64');
      }
      return item;
    });

    res.json(itemsWithImages);
  });
};

exports.getItemById = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM items WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching item:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const item = results[0];
    if (item.item_picture) {
      item.item_picture = Buffer.from(item.item_picture).toString('base64');
    }

    res.json(item);
  });
};

exports.updateItem = [
  upload.single('item_picture'), // Try changing this to uploadSimple.single('item_picture') if issues persist
  (req, res) => {
    const { id } = req.params;
    const { name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description } = req.body;

    if (!name || !cost_price || !sale_price) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    const imageBuffer = req.file ? req.file.buffer : null;
    
    let query, values;
    
    if (imageBuffer) {
      query = `
        UPDATE items 
        SET name = ?, barcode = ?, unit = ?, cost_price = ?, sale_price = ?, tax = ?, vendor = ?, qty_on_hand = ?, description = ?, item_picture = ?
        WHERE id = ?
      `;
      values = [name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description, imageBuffer, id];
    } else {
      query = `
        UPDATE items 
        SET name = ?, barcode = ?, unit = ?, cost_price = ?, sale_price = ?, tax = ?, vendor = ?, qty_on_hand = ?, description = ?
        WHERE id = ?
      `;
      values = [name, barcode, unit, cost_price, sale_price, tax, vendor, qty_on_hand, description, id];
    }

    db.query(query, values, (err, result) => {
      if (err) {
        console.error('Error updating item:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      res.json({ message: 'Item updated successfully' });
    });
  }
];

exports.deleteItem = (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM items WHERE id = ?';

  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error deleting item:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  });
};

exports.getItemImage = (req, res) => {
  const { id } = req.params;
  const query = 'SELECT item_picture FROM items WHERE id = ?';

  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error fetching image:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0 || !results[0].item_picture) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imageBuffer = results[0].item_picture;
    
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', imageBuffer.length);
    
    res.send(imageBuffer);
  });
};