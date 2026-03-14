const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    currentGrade: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Parent', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Student', studentSchema);
