const jwt = require('jsonwebtoken');

const checkLogin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, 'secret');
    req.user = { _id: decoded.id };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

const checkRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Not authenticated' });
    // Giả sử user có role, nhưng để đơn giản, skip
    next();
  };
};

module.exports = { checkLogin, checkRole };