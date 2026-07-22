import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  p12Path: {
    type: String,
    required: true
  },
  mobileprovisionPath: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  teamId: String,
  bundleId: String,
  expiryDate: Date,
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('Certificate', certificateSchema);
