import mongoose from 'mongoose';

const appSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  bundleId: {
    type: String,
    required: true,
    unique: true
  },
  version: {
    type: String,
    required: true
  },
  icon: String,
  description: String,
  ipaPath: {
    type: String,
    required: true
  },
  originalIpaPath: String,
  source: {
    type: String,
    enum: ['altstore', 'custom', 'admin'],
    default: 'custom'
  },
  sourceUrl: String,
  certificates: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate'
  }],
  signings: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Signing'
  }],
  downloads: {
    type: Number,
    default: 0
  },
  qrCode: String,
  downloadLink: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('App', appSchema);
