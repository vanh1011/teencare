const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPackage', default: null },
    packageName: { type: String, required: true },
    price: { type: Number, default: null },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    totalSessions: { type: Number, required: true, min: 0 },
    usedSessions: { type: Number, required: true, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subscription', subscriptionSchema);
