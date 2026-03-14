const express = require('express');
const router = express.Router();
const Class = require('../models/Class');
const ClassRegistration = require('../models/ClassRegistration');
const Student = require('../models/Student');
const Subscription = require('../models/Subscription');
const ActivityLog = require('../models/ActivityLog');
const {
  validateRequired,
  validateTimeSlot,
  validateDayOfWeek,
  validateMaxStudents,
  validateObjectId,
} = require('../middleware/validate');

router.post('/', async (req, res, next) => {
  try {
    const { name, subject, day_of_week, time_slot, teacher_name, max_students } = req.body;
    const dayOfWeek = day_of_week ?? req.body.dayOfWeek;
    const timeSlot = time_slot ?? req.body.timeSlot;
    const teacherName = teacher_name ?? req.body.teacherName;
    const maxStudents = max_students ?? req.body.maxStudents;

    validateRequired(name, 'Tên lớp');
    validateRequired(subject, 'Môn học');
    validateDayOfWeek(dayOfWeek);
    validateTimeSlot(timeSlot);
    validateRequired(teacherName, 'Giáo viên');
    validateMaxStudents(maxStudents);

    const doc = await Class.create({
      name: name.trim(),
      subject: subject.trim(),
      dayOfWeek: Number(dayOfWeek),
      timeSlot: timeSlot.trim(),
      teacherName: teacherName.trim(),
      maxStudents: Number(maxStudents),
    });

    await ActivityLog.create({
      action: 'create',
      entity: 'class',
      entityId: doc._id,
      description: `Tạo lớp: ${doc.name}`,
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { day, search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (day !== undefined && day !== '') filter.dayOfWeek = Number(day);
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { teacherName: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Class.find(filter).sort({ dayOfWeek: 1, timeSlot: 1 }).skip(skip).limit(Number(limit)),
      Class.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.post('/:classId/register', async (req, res, next) => {
  try {
    const classId = req.params.classId;
    const studentId = req.body.student_id || req.body.studentId;

    validateObjectId(classId, 'classId');
    validateObjectId(studentId, 'studentId');

    const classDoc = await Class.findById(classId);
    if (!classDoc) return res.status(404).json({ success: false, error: 'Lớp không tồn tại' });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ success: false, error: 'Học sinh không tồn tại' });

    const currentCount = await ClassRegistration.countDocuments({ classId });
    if (currentCount >= classDoc.maxStudents) {
      return res.status(400).json({ success: false, error: 'Lớp đã đạt sĩ số tối đa' });
    }

    const existingSameClass = await ClassRegistration.findOne({ classId, studentId });
    if (existingSameClass) {
      return res.status(400).json({ success: false, error: 'Học sinh đã đăng ký lớp này' });
    }

    const existingRegs = await ClassRegistration.find({ studentId }).populate('classId');
    for (const reg of existingRegs) {
      const c = reg.classId;
      if (!c) continue;
      if (c.dayOfWeek !== classDoc.dayOfWeek) continue;
      if (timeSlotsOverlap(c.timeSlot, classDoc.timeSlot)) {
        return res.status(400).json({
          success: false,
          error: 'Trùng lịch: học sinh đã có lớp khác cùng khung giờ trong ngày này',
        });
      }
    }

    const now = new Date();
    const validSub = await Subscription.findOne({
      studentId,
      endDate: { $gte: now },
      $or: [
        { totalSessions: 0 },
        { $expr: { $lt: ['$usedSessions', '$totalSessions'] } },
      ],
    });
    if (!validSub) {
      return res.status(400).json({ success: false, error: 'Không có gói học còn hiệu lực hoặc đã hết buổi' });
    }

    const doc = await ClassRegistration.create({ classId, studentId });

    await ActivityLog.create({
      action: 'register',
      entity: 'registration',
      entityId: doc._id,
      description: `${student.name} đăng ký lớp ${classDoc.name}`,
      metadata: { classId, studentId },
    });

    const populated = await ClassRegistration.findById(doc._id)
      .populate('classId')
      .populate('studentId');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

function timeSlotsOverlap(slot1, slot2) {
  const parse = (s) => {
    const [a, b] = s.split('-').map((x) => x.trim());
    return { start: timeToMinutes(a), end: timeToMinutes(b) };
  };
  const p1 = parse(slot1);
  const p2 = parse(slot2);
  return p1.start < p2.end && p2.start < p1.end;
}

function timeToMinutes(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

module.exports = router;
