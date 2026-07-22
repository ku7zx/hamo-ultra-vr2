import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import Certificate from '../models/Certificate.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Multer configuration for certificate uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/certificates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.p12', '.pfx', '.mobileprovision'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .p12, .pfx, and .mobileprovision files are allowed'), false);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

/**
 * GET /api/certificates
 * Get all certificates
 */
router.get('/', async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: certificates.length,
      certificates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/certificates/:id
 * Get specific certificate
 */
router.get('/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id)
      .select('-password');

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'الشهادة غير موجودة'
      });
    }

    res.json({
      success: true,
      certificate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/certificates/upload
 * Upload new certificate
 */
router.post('/upload', upload.fields([
  { name: 'p12', maxCount: 1 },
  { name: 'mobileprovision', maxCount: 1 }
]), async (req, res) => {
  try {
    const { name, password, teamId, bundleId } = req.body;

    if (!name || !password) {
      if (req.files.p12) fs.unlinkSync(req.files.p12[0].path);
      if (req.files.mobileprovision) fs.unlinkSync(req.files.mobileprovision[0].path);
      return res.status(400).json({
        success: false,
        message: 'الاسم وكلمة المرور مطلوبة'
      });
    }

    if (!req.files.p12 || !req.files.mobileprovision) {
      if (req.files.p12) fs.unlinkSync(req.files.p12[0].path);
      if (req.files.mobileprovision) fs.unlinkSync(req.files.mobileprovision[0].path);
      return res.status(400).json({
        success: false,
        message: 'ملف P12 وملف Mobileprovision مطلوبان'
      });
    }

    const certificate = new Certificate({
      name,
      p12Path: req.files.p12[0].path,
      mobileprovisionPath: req.files.mobileprovision[0].path,
      password,
      teamId,
      bundleId,
      isDefault: false
    });

    await certificate.save();

    res.status(201).json({
      success: true,
      message: 'تم رفع الشهادة بنجاح',
      certificate: certificate.toObject({ transform: (doc, ret) => {
        delete ret.password;
        return ret;
      }})
    });
  } catch (error) {
    if (req.files?.p12) fs.unlinkSync(req.files.p12[0].path);
    if (req.files?.mobileprovision) fs.unlinkSync(req.files.mobileprovision[0].path);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * PUT /api/certificates/:id
 * Update certificate as default
 */
router.put('/:id/default', verifyToken, async (req, res) => {
  try {
    // Remove default from all certificates
    await Certificate.updateMany({}, { isDefault: false });

    // Set this certificate as default
    const certificate = await Certificate.findByIdAndUpdate(
      req.params.id,
      { isDefault: true },
      { new: true }
    );

    res.json({
      success: true,
      message: 'تم تعيين الشهادة الافتراضية',
      certificate
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/certificates/:id
 * Delete certificate
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'الشهادة غير موجودة'
      });
    }

    // Delete files
    if (fs.existsSync(certificate.p12Path)) {
      fs.unlinkSync(certificate.p12Path);
    }
    if (fs.existsSync(certificate.mobileprovisionPath)) {
      fs.unlinkSync(certificate.mobileprovisionPath);
    }

    await Certificate.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف الشهادة بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
