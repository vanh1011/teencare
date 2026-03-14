const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const ClassRegistration = require('../models/ClassRegistration');
const ActivityLog = require('../models/ActivityLog');
const { validateObjectId, validateRequired, ValidationError } = require('../middleware/validate');

const VALID_STATUSES = ['present', 'absent', 'late', 'excused'];

router.post('/', async (req, res, next) => {
  try {
    const { classId, studentId, date, status, note } = req.body;

    validateObjectId(classId, 'classId');
    validateObjectId(studentId, 'studentId');
    validateRequired(date, 'date');

    if (status && !VALID_STATUSES.includes(status)) {
      throw new ValidationError(`status phải là: ${VALID_STATUSES.join(', ')}`, 'status');
    }

    const isRegistered = await ClassRegistration.findOne({ classId, studentId });
    if (!isRegistered) {
      throw new ValidationError('Học sinh chưa đăng ký lớp này', 'studentId');
    }

    const doc = await Attendance.create({
      classId,
      studentId,
      date: new Date(date),
      status: status || 'present',
      note: note || '',
    });

    await ActivityLog.create({
      action: 'attendance',
      entity: 'attendance',
      entityId: doc._id,
      description: `Điểm danh: ${status || 'present'}`,
      metadata: { classId, studentId, date },
    });

    const populated = await Attendance.findById(doc._id)
      .populate('classId', 'name timeSlot')
      .populate('studentId', 'name');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { classId, studentId, date, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (classId) filter.classId = classId;
    if (studentId) filter.studentId = studentId;
    if (date) {
      const d = new Date(date);
      filter.date = {
        $gte: new Date(d.getFullYear(), d.getMonth(), d.getDate()),
        $lt: new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1),
      };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Attendance.find(filter)
        .populate('classId', 'name timeSlot dayOfWeek')
        .populate('studentId', 'name')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Attendance.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { status, note } = req.body;
    if (status && !VALID_STATUSES.includes(status)) {
      throw new ValidationError(`status phải là: ${VALID_STATUSES.join(', ')}`, 'status');
    }

    const update = {};
    if (status) update.status = status;
    if (note !== undefined) update.note = note;

    const doc = await Attendance.findByIdAndUpdate(req.params.id, update, { new: true })
      .populate('classId', 'name timeSlot')
      .populate('studentId', 'name');
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy bản ghi điểm danh' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
