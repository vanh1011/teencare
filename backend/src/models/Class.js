const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    subject: { type: String, required: true },
    dayOfWeek: { type: Number, required: true, min: 0, max: 6 },
    timeSlot: { type: String, required: true },
    teacherName: { type: String, required: true },
    maxStudents: { type: Number, required: true, min: 1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
