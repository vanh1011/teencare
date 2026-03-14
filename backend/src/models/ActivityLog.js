const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['create', 'update', 'delete', 'register', 'unregister', 'use_session', 'attendance'],
      required: true,
    },
    entity: {
      type: String,
      enum: ['parent', 'student', 'class', 'subscription', 'registration', 'attendance', 'package'],
      required: true,
    },
    entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
    description: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ entity: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
