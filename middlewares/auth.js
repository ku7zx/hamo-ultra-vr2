import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'hamo-ultra-vr2-secret-key';

/**
 * Middleware to verify JWT token
 */
export const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لا يوجد رمز (token) - يرجى تسجيل الدخول'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded.admin;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'انتهت صلاحية الرمز (token) - يرجى تسجيل الدخول مجددا'
      });
    }
    res.status(401).json({
      success: false,
      message: 'رمز غير صالح'
    });
  }
};

/**
 * Middleware for error handling
 */
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  if (err instanceof jwt.JsonWebTokenError) {
    return res.status(401).json({
      success: false,
      message: 'خطأ في المصادقة'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'حدث خطأ ما'
  });
};

/**
 * Middleware for CORS
 */
export const corsMiddleware = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
};

export default {
  verifyToken,
  errorHandler,
  corsMiddleware
};
