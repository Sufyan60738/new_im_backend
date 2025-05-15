const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { name, email, password } = req.body;
  
  try {
    // For mysql package, the callback style would be:
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results, fields) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Database error', error: error.message });
      }

      if (results.length > 0) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      
      db.query(
        'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
        [name, email, hashedPassword],
        (error, results, fields) => {
          if (error) {
            console.error('Insert error:', error);
            return res.status(500).json({ message: 'Registration failed', error: error.message });
          }
          res.status(201).json({ message: 'User registered successfully' });
        }
      );
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ 
      message: 'Server error',
      error: err.message 
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  try {
    db.query('SELECT * FROM users WHERE email = ?', [email], async (error, results, fields) => {
      if (error) {
        console.error('Database error:', error);
        return res.status(500).json({ message: 'Database error', error: error.message });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const user = results[0];
      const valid = await bcrypt.compare(password, user.password);
      
      if (!valid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      res.status(200).json({ 
        message: 'Login successful', 
        user: { id: user.id, name: user.name } 
      });
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.logout = async (req, res) => {
    try {
      // In a real app, you might want to:
      // 1. Invalidate the token (if using JWT)
      // 2. Clear session data (if using sessions)
      // 3. Log the logout action
      
      res.status(200).json({ 
        success: true,
        message: 'Logged out successfully' 
      });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ 
        success: false,
        message: 'Logout failed',
        error: err.message 
      });
    }
  };

  // authController.js
exports.getProfile = async (req, res) => {
    try {
      // Assuming you have middleware that sets req.user
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
  
      const [user] = await db.query(
        'SELECT id, name, email, created_at FROM users WHERE id = ?', 
        [req.user.id]
      );
  
      if (user.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      res.status(200).json({
        success: true,
        user: user[0]
      });
    } catch (err) {
      console.error('Profile error:', err);
      res.status(500).json({ 
        success: false,
        message: 'Failed to fetch profile',
        error: err.message 
      });
    }
  };