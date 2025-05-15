const jwt = require('jsonwebtoken');

exports.protect = async (req, res, next) => {
  try {
    // 1) Get token from header
    let token;
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route'
      });
    }

    // 2) Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const [users] = await db.query('SELECT id FROM users WHERE id = ?', [decoded.id]);
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists'
      });
    }

    // 4) Grant access
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
      error: err.message
    });
  }
};