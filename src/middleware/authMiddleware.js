const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_2026_antigravity';

/**
 * Middleware xác thực JWT Token
 */
function authenticateToken(req, res, next) {
  // Lấy token từ header Authorization ("Bearer <token>"), x-access-token, body hoặc query
  const authHeader = req.headers['authorization'];
  let token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    token = req.headers['x-access-token'] || req.body?.token || req.query?.token;
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Truy cập bị từ chối: Không tìm thấy Token xác thực (Missing Bearer Token).'
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        status: 'error',
        message: 'Token không hợp lệ hoặc đã hết hạn (Invalid or Expired Token).',
        error: err.message
      });
    }

    req.user = user;
    next();
  });
}

module.exports = authenticateToken;
