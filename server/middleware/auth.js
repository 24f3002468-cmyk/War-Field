const jwt = require('jsonwebtoken');

const getSecret = () => process.env.JWT_SECRET || 'execos-super-secret-change-in-production';

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, getSecret());
    req.userId = decoded.userId;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const generateToken = (userId) => {
  return jwt.sign({ userId }, getSecret(), { expiresIn: '30d' });
};

module.exports = { authMiddleware, generateToken };
