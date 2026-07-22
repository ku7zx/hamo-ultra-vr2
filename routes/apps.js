import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import App from '../models/App.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Multer configuration for IPA uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/apps');
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
    if (file.mimetype === 'application/octet-stream' || file.originalname.endsWith('.ipa')) {
      cb(null, true);
    } else {
      cb(new Error('Only IPA files are allowed'), false);
    }
  },
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

/**
 * GET /api/apps
 * Get all applications
 */
router.get('/', async (req, res) => {
  try {
    const apps = await App.find()
      .populate('certificates')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: apps.length,
      apps
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/apps/:id
 * Get specific application
 */
router.get('/:id', async (req, res) => {
  try {
    const app = await App.findById(req.params.id)
      .populate('certificates')
      .populate('signings');

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'التطبيق غير موجود'
      });
    }

    res.json({
      success: true,
      app
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * POST /api/apps/upload
 * Upload new IPA application
 */
router.post('/upload', upload.single('ipa'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'ملف IPA مطلوب'
      });
    }

    const { name, bundleId, version, description } = req.body;

    if (!name || !bundleId || !version) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'الاسم و Bundle ID والإصدار مطلوبة'
      });
    }

    // Check if app already exists
    const existingApp = await App.findOne({ bundleId });
    if (existingApp) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'هذا التطبيق موجود بالفعل'
      });
    }

    const app = new App({
      name,
      bundleId,
      version,
      description,
      ipaPath: req.file.path,
      originalIpaPath: req.file.path,
      source: 'custom'
    });

    await app.save();

    res.status(201).json({
      success: true,
      message: 'تم تحميل التطبيق بنجاح',
      app
    });
  } catch (error) {
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * DELETE /api/apps/:id
 * Delete application
 */
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'التطبيق غير موجود'
      });
    }

    // Delete IPA files
    if (app.ipaPath && fs.existsSync(app.ipaPath)) {
      fs.unlinkSync(app.ipaPath);
    }

    await App.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'تم حذف التطبيق بنجاح'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/apps/:id/download
 * Download application IPA
 */
router.get('/:id/download', async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'التطبيق غير موجود'
      });
    }

    if (!fs.existsSync(app.ipaPath)) {
      return res.status(404).json({
        success: false,
        message: 'ملف IPA غير موجود'
      });
    }

    // Increment downloads
    app.downloads += 1;
    await app.save();

    res.download(app.ipaPath, `${app.name}.ipa`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
