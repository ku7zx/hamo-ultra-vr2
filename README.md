# 🚀 Hamo Ultra VR2 - IPA Signing & Distribution Platform

**Professional iOS Application Signing and Distribution Tool**

## ✨ Features

### 📱 5 Main Pages

1. **مصادر (Sources)** - Browse and download IPA from AltStore directory
2. **تطبيقات (Applications)** - View all downloaded and managed applications
3. **توقيع حمو (Hamo Signing)** - Sign applications with automatic or custom certificates
4. **شهادة (Certificates)** - Manage signing certificates (p12 & mobileprovision)
5. **HAMO UL (Admin Panel)** - Admin dashboard to manage store applications

### 🔐 Security
- Admin password protection (KU7ZXA)
- Secure certificate storage
- JWT authentication
- Encrypted file transmission

### ⚡ Core Functionality
- Automatic IPA signing with zsign
- Custom certificate support
- QR Code generation for sharing
- Download tracking
- Real-time signing status
- Responsive mobile-first UI

## 🛠️ Tech Stack

### Backend
- **Node.js + Express** - Server framework
- **MongoDB** - Database
- **zsign** - IPA signing tool
- **Multer** - File uploads

### Frontend
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **QR Code** - Sharing functionality

### Infrastructure
- **VPS (DigitalOcean/Hostinger)** - Hosting
- **MongoDB Atlas** - Cloud database
- **S3 (Optional)** - File storage

## 📦 Installation

### Prerequisites
```bash
- Node.js 18+
- MongoDB
- zsign tool (on VPS)
```

### Backend Setup
```bash
git clone https://github.com/ku7zx/hamo-ultra-vr2.git
cd hamo-ultra-vr2
npm install
cp .env.example .env
# Edit .env with your configuration
npm start
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

## 🚀 Deployment

### On VPS (Recommended)
```bash
# SSH into VPS
ssh root@your-vps-ip

# Install dependencies
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git mongodb

# Install zsign
wget https://github.com/zhlynn/zsign/releases/download/v0.4.0/zsign_linux
sudo mv zsign_linux /usr/local/bin/zsign
sudo chmod +x /usr/local/bin/zsign

# Clone and setup
git clone https://github.com/ku7zx/hamo-ultra-vr2.git
cd hamo-ultra-vr2
npm install
npm start
```

## 📝 Environment Variables

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/hamo-ultra-vr2
ADMIN_PASSWORD=KU7ZXA
ZSIGN_PATH=/usr/local/bin/zsign
```

## 🔑 Default Credentials

- **Admin Panel**: KU7ZXA
- **Certificate Management**: KU7ZXA

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Logout

### Applications
- `GET /api/apps` - List all apps
- `POST /api/apps/upload` - Upload new app
- `GET /api/apps/:id` - Get app details

### Signing
- `POST /api/signing/sign` - Sign application
- `GET /api/signing/status/:id` - Get signing status
- `GET /api/signing/download/:id` - Download signed app

### Certificates
- `POST /api/certificates/upload` - Upload certificate
- `GET /api/certificates` - List certificates
- `DELETE /api/certificates/:id` - Delete certificate

### Admin
- `POST /api/admin/apps/add` - Add to store
- `DELETE /api/admin/apps/:id` - Remove from store

## 📊 Project Structure

```
hamo-ultra-vr2/
├── server.js
├── models/
│   ├── App.js
│   ├── Certificate.js
│   └── Signing.js
├── routes/
│   ├── auth.js
│   ├── apps.js
│   ├── signing.js
│   ├── certificates.js
│   └── admin.js
├── controllers/
├── middlewares/
├── utils/
│   └── zsign.js
├── client/
│   └── src/
│       ├── pages/
│       └── components/
└── package.json
```

## ⚙️ Configuration

### zsign Setup
```bash
# Verify zsign installation
zsign --version

# Test signing
zsign -k certificate.p12 -m mobileprovision.mobileprovision -p password -o output.ipa input.ipa
```

## 🔧 Troubleshooting

### zsign not found
```bash
sudo ln -s /path/to/zsign /usr/local/bin/zsign
```

### MongoDB connection error
```bash
mongod --version
# Start MongoDB service
```

### File upload errors
```bash
# Ensure upload directory exists
mkdir -p ./uploads/{apps,certificates}
chmod 777 ./uploads
```

## 📄 License

MIT License - KU7ZX 2026

## 🤝 Support

For issues and questions, please open an issue on GitHub.

---

**Made with ❤️ for iOS Developers**
