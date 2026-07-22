import mongoose from 'mongoose';

const signingSchema = new mongoose.Schema({
  appId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'App',
    required: true
  },
  certificateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Certificate',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  signingType: {
    type: String,
    enum: ['automatic', 'custom'],
    default: 'automatic'
  },
  signedIpaPath: String,
  qrCode: String,
  downloadLink: String,
  proCode: String,
  expiresAt: Date,
  error: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

export default mongoose.model('Signing', signingSchema);
