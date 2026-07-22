import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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

// Database Connection
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => console.error('❌ MongoDB Error:', err));
}

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    uptime: process.uptime()
  });
});

// API Routes (Will be added)
app.use('/api/auth', (req, res) => res.json({ message: 'Auth API' }));
app.use('/api/apps', (req, res) => res.json({ message: 'Apps API' }));
app.use('/api/signing', (req, res) => res.json({ message: 'Signing API' }));
app.use('/api/certificates', (req, res) => res.json({ message: 'Certificates API' }));
app.use('/api/admin', (req, res) => res.json({ message: 'Admin API' }));

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    timestamp: new Date()
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 Hamo Ultra VR2 Server Running on http://localhost:${PORT}`);
  console.log(`📁 Upload Directory: ${uploadDir}`);
  console.log(`🔧 Temp Directory: ${tempDir}`);
  console.log(`✨ Ready for IPA Signing and Distribution\n`);
});

export default app;
