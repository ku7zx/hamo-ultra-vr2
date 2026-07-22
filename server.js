import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import routes
import authRoutes from './routes/auth.js';
import appRoutes from './routes/app.js';
import certificateRoutes from './routes/certificate.js';
import signingRoutes from './routes/signing.js';
import adminRoutes from './routes/admin.js';
import storeRoutes from './routes/store.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Create necessary directories
const uploadDir = process.env.UPLOAD_DIR || './uploads';
const tempDir = process.env.TEMP_DIR || '/tmp/hamo-signing';

if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
if (!fs.existsSync(path.join(uploadDir, 'apps'))) fs.mkdirSync(path.join(uploadDir, 'apps'), { recursive: true });
if (!fs.existsSync(path.join(uploadDir, 'certificates'))) fs.mkdirSync(path.join(uploadDir, 'certificates'), { recursive: true });
if (!fs.existsSync(path.join(uploadDir, 'signing'))) fs.mkdirSync(path.join(uploadDir, 'signing'), { recursive: true });

// Static files
app.use('/uploads', express.static(uploadDir));

// Database Connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
    .then(() => console.log('✅ MongoDB متصل'))
    .catch(err => console.error('❌ خطأ MongoDB:', err));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'الخادم يعمل بشكل صحيح',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API Documentation
app.get('/api/docs', (req, res) => {
  res.json({
    success: true,
    version: '1.0.0',
    name: 'Hamo Ultra VR2 API',
    description: 'API متقدمة لتوقيع التطبيقات وإدارة المتجر',
    baseUrl: process.env.API_URL || `http://localhost:${PORT}`,
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        refresh: 'POST /api/auth/refresh'
      },
      apps: {
        upload: 'POST /api/app/upload',
        list: 'GET /api/app',
        get: 'GET /api/app/:id',
        update: 'PUT /api/app/:id',
        delete: 'DELETE /api/app/:id',
        download: 'GET /api/app/:id/download'
      },
      certificates: {
        upload: 'POST /api/certificate/upload',
        list: 'GET /api/certificate',
        get: 'GET /api/certificate/:id',
        delete: 'DELETE /api/certificate/:id'
      },
      signing: {
        sign: 'POST /api/signing/sign',
        status: 'GET /api/signing/:id',
        download: 'GET /api/signing/:id/download',
        history: 'GET /api/signing/app/:appId'
      },
      admin: {
        stats: 'GET /api/admin/stats',
        apps: 'GET /api/admin/apps',
        addApp: 'POST /api/admin/apps/add',
        updateApp: 'PUT /api/admin/apps/:id',
        deleteApp: 'DELETE /api/admin/apps/:id',
        certificates: 'GET /api/admin/certificates',
        logs: 'GET /api/admin/logs'
      },
      store: {
        apps: 'GET /api/store/apps',
        appDetails: 'GET /api/store/apps/:id',
        trending: 'GET /api/store/trending',
        new: 'GET /api/store/new',
        featured: 'GET /api/store/featured',
        search: 'GET /api/store/search',
        categories: 'GET /api/store/categories',
        stats: 'GET /api/store/stats'
      }
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/app', appRoutes);
app.use('/api/certificate', certificateRoutes);
app.use('/api/signing', signingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/store', storeRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'المسار غير موجود',
    path: req.path,
    method: req.method
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('❌ خطأ:', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'حدث خطأ في الخادم',
    timestamp: new Date(),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 خادم Hamo Ultra VR2 يعمل على http://localhost:${PORT}`);
  console.log(`📁 مجلد التحميل: ${uploadDir}`);
  console.log(`🔧 مجلد المؤقت: ${tempDir}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api/docs`);
  console.log(`❤️ Health Check: http://localhost:${PORT}/api/health`);
  console.log(`✨ جاهز لتوقيع التطبيقات والتوزيع\n`);
});

export default app;
