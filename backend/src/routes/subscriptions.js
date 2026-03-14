const express = require('express');
const router = express.Router();
const Subscription = require('../models/Subscription');
const Student = require('../models/Student');
const SubscriptionPackage = require('../models/SubscriptionPackage');
const ActivityLog = require('../models/ActivityLog');
const { validateObjectId, validateDateRange, ValidationError } = require('../middleware/validate');

router.post('/', async (req, res, next) => {
  try {
    const {
      student_id, studentId,
      package_key, packageId,
      package_name, packageName,
      start_date, startDate,
      end_date, endDate,
      total_sessions, totalSessions,
      used_sessions, usedSessions,
    } = req.body;

    let name = package_name || packageName;
    let total = total_sessions ?? totalSessions ?? 0;
    let price = req.body.price ?? null;
    let pkgId = packageId || null;

    const sid = student_id || studentId;
    validateObjectId(sid, 'studentId');

    const studentDoc = await Student.findById(sid);
    if (!studentDoc) {
      return res.status(404).json({ success: false, error: 'Học sinh không tồn tại', field: 'studentId' });
    }

    if (package_key) {
      const pkg = await SubscriptionPackage.findOne({ key: package_key });
      if (!pkg) return res.status(400).json({ success: false, error: 'Gói không tồn tại: ' + package_key });
      name = pkg.name;
      total = pkg.totalSessions;
      price = pkg.price;
      pkgId = pkg._id;
    }

    if (!name) throw new ValidationError('Tên gói là bắt buộc', 'packageName');

    const sDate = start_date || startDate;
    const eDate = end_date || endDate;
    if (!sDate || !eDate) throw new ValidationError('Ngày bắt đầu và kết thúc là bắt buộc', 'startDate');
    validateDateRange(sDate, eDate);

    const now = new Date();
    const duplicateFilter = { studentId: sid, endDate: { $gte: now } };
    if (pkgId) duplicateFilter.packageId = pkgId;
    else if (name) duplicateFilter.packageName = name;
    const existingActive = await Subscription.findOne(duplicateFilter);
    if (existingActive) {
      return res.status(400).json({
        success: false,
        error: 'Học sinh đã có gói "' + (name || existingActive.packageName) + '" còn hiệu lực. Không thể đăng ký trùng.',
      });
    }

    const sub = await Subscription.create({
      studentId: sid,
      packageId: pkgId,
      packageName: name,
      price,
      startDate: new Date(sDate),
      endDate: new Date(eDate),
      totalSessions: total,
      usedSessions: used_sessions ?? usedSessions ?? 0,
    });

    await ActivityLog.create({
      action: 'create',
      entity: 'subscription',
      entityId: sub._id,
      description: `${studentDoc.name} đăng ký gói ${name}`,
      metadata: { studentId: sid, packageName: name },
    });

    const populated = await Subscription.findById(sub._id).populate('studentId').populate('packageId');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { studentId, active, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (studentId) filter.studentId = studentId;
    if (active === 'true') filter.endDate = { $gte: new Date() };
    if (active === 'false') filter.endDate = { $lt: new Date() };

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Subscription.find(filter)
        .populate('studentId')
        .populate('packageId')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Subscription.countDocuments(filter),
    ]);

    res.json({
      items,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const doc = await Subscription.findById(req.params.id).populate('studentId').populate('packageId');
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy gói đăng ký' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/use', async (req, res, next) => {
  try {
    const doc = await Subscription.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy gói đăng ký' });

    if (new Date(doc.endDate) < new Date()) {
      return res.status(400).json({ success: false, error: 'Gói đã hết hạn' });
    }
    if (doc.totalSessions === 0) {
      return res.status(400).json({ success: false, error: 'Gói này không tính theo buổi' });
    }
    if (doc.usedSessions >= doc.totalSessions) {
      return res.status(400).json({ success: false, error: 'Gói đã hết buổi' });
    }

    doc.usedSessions += 1;
    await doc.save();

    await ActivityLog.create({
      action: 'use_session',
      entity: 'subscription',
      entityId: doc._id,
      description: `Sử dụng 1 buổi (${doc.usedSessions}/${doc.totalSessions})`,
    });

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
