import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import Signing from '../models/Signing.js';
import App from '../models/App.js';
import Certificate from '../models/Certificate.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads/signing');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

/**
 * POST /api/signing/sign
 * Sign an application
 */
router.post('/sign', verifyToken, upload.single('ipa'), async (req, res) => {
  try {
    const { appId, certificateId, customPassword } = req.body;

    if (!appId || !certificateId) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'App ID و Certificate ID مطلوبة'
      });
    }

    const app = await App.findById(appId);
    const certificate = await Certificate.findById(certificateId);

    if (!app || !certificate) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'التطبيق أو الشهادة غير موجودة'
      });
    }

    const ipaPath = req.file ? req.file.path : app.ipaPath;
    const outputPath = path.join(process.cwd(), 'uploads/signing', `${Date.now()}-signed.ipa`);
    const password = customPassword || certificate.password;

    // Create signing record
    const signing = new Signing({
      app: appId,
      certificate: certificateId,
      status: 'processing',
      inputPath: ipaPath,
      outputPath
    });

    await signing.save();

    // Execute zsign command
    try {
      const zsignPath = process.env.ZSIGN_PATH || '/usr/local/bin/zsign';
      const command = `${zsignPath} -k "${certificate.p12Path}" -m "${certificate.mobileprovisionPath}" -p "${password}" -o "${outputPath}" "${ipaPath}"`;
      
      execSync(command, { stdio: 'pipe' });

      signing.status = 'completed';
      signing.completedAt = new Date();
      await signing.save();

      res.status(201).json({
        success: true,
        message: 'تم توقيع التطبيق بنجاح',
        signing
      });
    } catch (error) {
      signing.status = 'failed';
      signing.error = error.message;
      await signing.save();

      throw new Error(`فشل التوقيع: ${error.message}`);
    }
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/signing/:id
 * Get signing status
 */
router.get('/:id', async (req, res) => {
  try {
    const signing = await Signing.findById(req.params.id)
      .populate('app')
      .populate('certificate', '-password');

    if (!signing) {
      return res.status(404).json({
        success: false,
        message: 'عملية التوقيع غير موجودة'
      });
    }

    res.json({
      success: true,
      signing
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/signing/:id/download
 * Download signed IPA
 */
router.get('/:id/download', async (req, res) => {
  try {
    const signing = await Signing.findById(req.params.id);

    if (!signing) {
      return res.status(404).json({
        success: false,
        message: 'عملية التوقيع غير موجودة'
      });
    }

    if (signing.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'التطبيق لم يتم توقيعه بعد'
      });
    }

    if (!fs.existsSync(signing.outputPath)) {
      return res.status(404).json({
        success: false,
        message: 'ملف IPA الموقع غير موجود'
      });
    }

    const app = await App.findById(signing.app);
    res.download(signing.outputPath, `${app.name}-signed.ipa`);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/signing/app/:appId
 * Get all signings for an app
 */
router.get('/app/:appId', async (req, res) => {
  try {
    const signings = await Signing.find({ app: req.params.appId })
      .populate('certificate', '-password')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: signings.length,
      signings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
