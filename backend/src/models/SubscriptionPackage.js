const mongoose = require('mongoose');

const subscriptionPackageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, default: null },
    totalSessions: { type: Number, required: true, min: 0 },
    benefits: [{ type: String }],
    isPopular: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPackage', subscriptionPackageSchema);
