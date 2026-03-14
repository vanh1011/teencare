const express = require('express');
const router = express.Router();
const ClassRegistration = require('../models/ClassRegistration');
const Class = require('../models/Class');
const Subscription = require('../models/Subscription');
const ActivityLog = require('../models/ActivityLog');

const HOURS_REFUND_THRESHOLD = 24;

router.get('/', async (req, res, next) => {
  try {
    const { studentId, classId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      ClassRegistration.find(filter)
        .populate('classId')
        .populate('studentId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      ClassRegistration.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const reg = await ClassRegistration.findById(req.params.id).populate('classId').populate('studentId');
    if (!reg) return res.status(404).json({ success: false, error: 'Không tìm thấy đăng ký' });

    const classDoc = reg.classId;
    if (!classDoc) return res.status(400).json({ success: false, error: 'Lớp không tồn tại' });

    const now = new Date();
    const nextClassTime = getNextClassTime(classDoc.dayOfWeek, classDoc.timeSlot);
    const hoursUntilClass = nextClassTime ? (nextClassTime - now) / (1000 * 60 * 60) : 0;
    const shouldRefund = nextClassTime && hoursUntilClass > HOURS_REFUND_THRESHOLD;

    if (shouldRefund) {
      const sub = await Subscription.findOne({
        studentId: reg.studentId._id,
        endDate: { $gte: now },
        $expr: { $lt: ['$usedSessions', '$totalSessions'] },
      });
      if (sub && sub.usedSessions > 0) {
        sub.usedSessions -= 1;
        await sub.save();
      }
    }

    await ClassRegistration.findByIdAndDelete(req.params.id);

    await ActivityLog.create({
      action: 'unregister',
      entity: 'registration',
      entityId: reg._id,
      description: `${reg.studentId?.name || 'HS'} huỷ đăng ký lớp ${classDoc.name}`,
      metadata: { refunded: shouldRefund },
    });

    res.json({
      success: true,
      message: 'Đã hủy đăng ký',
      refunded: shouldRefund,
    });
  } catch (err) {
    next(err);
  }
});

function getNextClassTime(dayOfWeek, timeSlot) {
  const [startStr] = timeSlot.split('-').map((s) => s.trim());
  if (!startStr) return null;
  const [h, m] = startStr.split(':').map(Number);
  const now = new Date();
  const currentDay = now.getDay();
  let daysUntil = dayOfWeek - currentDay;
  if (daysUntil < 0) daysUntil += 7;
  if (daysUntil === 0 && (now.getHours() > h || (now.getHours() === h && now.getMinutes() >= m))) {
    daysUntil = 7;
  }
  const next = new Date(now);
  next.setDate(next.getDate() + daysUntil);
  next.setHours(h || 0, m || 0, 0, 0);
  return next;
}

module.exports = router;
