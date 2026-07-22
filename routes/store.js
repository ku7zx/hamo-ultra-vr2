import express from 'express';
import App from '../models/App.js';
import Signing from '../models/Signing.js';

const router = express.Router();

/**
 * GET /api/store/apps
 * Get all published applications
 */
router.get('/apps', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    let query = { isPublished: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { bundleId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await App.countDocuments(query);
    const apps = await App.find(query)
      .select('-ipaPath -originalIpaPath')
      .sort({ downloads: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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
 * GET /api/store/apps/:id
 * Get app details
 */
router.get('/apps/:id', async (req, res) => {
  try {
    const app = await App.findById(req.params.id)
      .select('-ipaPath -originalIpaPath')
      .populate('signings', 'status createdAt');

    if (!app || !app.isPublished) {
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
 * GET /api/store/categories
 * Get all app categories
 */
router.get('/categories', async (req, res) => {
  try {
    const categories = await App.distinct('category', { isPublished: true });
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => ({
        name: cat,
        count: await App.countDocuments({ category: cat, isPublished: true })
      }))
    );

    res.json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * GET /api/store/trending
 * Get trending applications
 */
router.get('/trending', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const apps = await App.find({ isPublished: true })
      .select('-ipaPath -originalIpaPath')
      .sort({ downloads: -1 })
      .limit(parseInt(limit));

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
 * GET /api/store/new
 * Get new applications
 */
router.get('/new', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const apps = await App.find({ isPublished: true })
      .select('-ipaPath -originalIpaPath')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

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
 * GET /api/store/featured
 * Get featured applications
 */
router.get('/featured', async (req, res) => {
  try {
    const apps = await App.find({ isPublished: true, isFeatured: true })
      .select('-ipaPath -originalIpaPath')
      .limit(10);

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
 * GET /api/store/search
 * Search applications
 */
router.get('/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'يجب تقديم كلمة بحث'
      });
    }

    const skip = (page - 1) * limit;
    const query = {
      isPublished: true,
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { bundleId: { $regex: q, $options: 'i' } }
      ]
    };

    const total = await App.countDocuments(query);
    const apps = await App.find(query)
      .select('-ipaPath -originalIpaPath')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ downloads: -1 });

    res.json({
      success: true,
      query: q,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
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
 * GET /api/store/stats
 * Get store statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const totalApps = await App.countDocuments({ isPublished: true });
    const totalDownloads = (await App.aggregate([
      { $match: { isPublished: true } },
      {
        $group: {
          _id: null,
          total: { $sum: '$downloads' }
        }
      }
    ]))[0]?.total || 0;

    const categories = await App.distinct('category', { isPublished: true });

    res.json({
      success: true,
      stats: {
        totalApps,
        totalDownloads,
        totalCategories: categories.length,
        timestamp: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

export default router;
