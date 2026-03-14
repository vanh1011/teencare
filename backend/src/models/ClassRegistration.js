const mongoose = require('mongoose');

const classRegistrationSchema = new mongoose.Schema(
  {
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  },
  { timestamps: true }
);

classRegistrationSchema.index({ classId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('ClassRegistration', classRegistrationSchema);
