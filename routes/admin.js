import express from 'express';
import App from '../models/App.js';
import Certificate from '../models/Certificate.js';
import Signing from '../models/Signing.js';
import { verifyToken } from '../middlewares/auth.js';

const router = express.Router();

/**
 * POST /api/admin/apps/add
 * Add app to store (from AltStore or custom)
 */
router.post('/apps/add', verifyToken, async (req, res) => {
  try {
    const { name, bundleId, version, description, sourceUrl, category, icon } = req.body;

    if (!name || !bundleId || !version) {
      return res.status(400).json({
        success: false,
        message: 'الاسم و Bundle ID والإصدار مطلوبة'
      });
    }

    // Check if app already exists
    const existingApp = await App.findOne({ bundleId });
    if (existingApp) {
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
      sourceUrl,
      category,
      icon,
      source: sourceUrl ? 'altstore' : 'custom',
      isPublished: true
    });

    await app.save();

    res.status(201).json({
      success: true,
      message: 'تم إضافة التطبيق للمتجر بنجاح',
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
 * GET /api/admin/apps
 * Get all apps (admin view)
 */
router.get('/apps', verifyToken, async (req, res) => {
  try {
    const apps = await App.find()
      .populate('signings')
      .sort({ createdAt: -1 });

    const stats = {
      totalApps: apps.length,
      publishedApps: apps.filter(a => a.isPublished).length,
      totalDownloads: apps.reduce((sum, a) => sum + a.downloads, 0),
      totalSignings: await Signing.countDocuments()
    };

    res.json({
      success: true,
      stats,
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
 * PUT /api/admin/apps/:id
 * Update app details
 */
router.put('/apps/:id', verifyToken, async (req, res) => {
  try {
    const { name, description, category, isPublished, icon } = req.body;

    const app = await App.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        category,
        isPublished,
        icon
      },
      { new: true }
    );

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'التطبيق غير موجود'
      });
    }

    res.json({
      success: true,
      message: 'تم تحديث التطبيق بنجاح',
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
 * DELETE /api/admin/apps/:id
 * Delete app from store
 */
router.delete('/apps/:id', verifyToken, async (req, res) => {
  try {
    const app = await App.findByIdAndDelete(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: 'التطبيق غير موجود'
      });
    }

    // Delete related signings
    await Signing.deleteMany({ app: req.params.id });

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
 * GET /api/admin/certificates
 * Get all certificates (admin view)
 */
router.get('/certificates', verifyToken, async (req, res) => {
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
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const totalApps = await App.countDocuments();
    const publishedApps = await App.countDocuments({ isPublished: true });
    const totalCertificates = await Certificate.countDocuments();
    const totalSignings = await Signing.countDocuments();
    const completedSignings = await Signing.countDocuments({ status: 'completed' });
    const failedSignings = await Signing.countDocuments({ status: 'failed' });
    
    const totalDownloads = (await App.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$downloads' }
        }
      }
    ]))[0]?.total || 0;

    const recentSignings = await Signing.find()
      .populate('app', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({
      success: true,
      stats: {
        totalApps,
        publishedApps,
        totalCertificates,
        totalSignings,
        completedSignings,
        failedSignings,
        totalDownloads,
        successRate: totalSignings > 0 ? ((completedSignings / totalSignings) * 100).toFixed(2) : 0
      },
      recentSignings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/admin/logs
 * Get system logs and activity
 */
router.get('/logs', verifyToken, async (req, res) => {
  try {
    const logs = {
      recentApps: await App.find().sort({ createdAt: -1 }).limit(5),
      recentSignings: await Signing.find()
        .populate('app', 'name')
        .sort({ createdAt: -1 })
        .limit(5),
      recentCertificates: await Certificate.find()
        .sort({ createdAt: -1 })
        .limit(5)
    };

    res.json({
      success: true,
      logs
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
