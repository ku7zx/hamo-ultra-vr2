import express from 'express';
import jwt from 'jsonwebtoken';

const router = express.Router();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'KU7ZXA';
const JWT_SECRET = process.env.JWT_SECRET || 'hamo-ultra-vr2-secret-key';

/**
 * POST /api/auth/login
 * Admin login endpoint
 */
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور مطلوبة'
      });
    }

    if (password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        success: false,
        message: 'كلمة المرور غير صحيحة'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { admin: true, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      token
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/auth/logout
 * Admin logout endpoint
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'تم تسجيل الخروج بنجاح'
  });
});

/**
 * GET /api/auth/verify
 * Verify JWT token
 */
router.get('/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'لا يوجد رمز (token)'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    res.json({
      success: true,
      verified: true,
      admin: decoded.admin
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'الرمز غير صالح أو منتهي الصلاحية'
    });
  }
});

export default router;
