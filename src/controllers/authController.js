const db = require('../config/db');
const bcrypt = require('bcrypt');

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
