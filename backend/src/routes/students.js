const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const Parent = require('../models/Parent');
const ActivityLog = require('../models/ActivityLog');
const { validateRequired, validateGender, validateObjectId } = require('../middleware/validate');

router.post('/', async (req, res, next) => {
  try {
    const { name, dob, gender, current_grade, parent_id } = req.body;
    const parentId = parent_id || req.body.parentId;
    const currentGrade = current_grade ?? req.body.currentGrade;

    validateRequired(name, 'Họ tên');
    validateRequired(dob, 'Ngày sinh');
    validateGender(gender);
    validateRequired(currentGrade, 'Lớp hiện tại');
    validateObjectId(parentId, 'parentId');

    const parentExists = await Parent.findById(parentId);
    if (!parentExists) {
      return res.status(404).json({ success: false, error: 'Phụ huynh không tồn tại', field: 'parentId' });
    }

    const dobDate = new Date(dob);
    if (isNaN(dobDate.getTime())) {
      return res.status(400).json({ success: false, error: 'Ngày sinh không hợp lệ', field: 'dob' });
    }
    if (dobDate > new Date()) {
      return res.status(400).json({ success: false, error: 'Ngày sinh không thể ở tương lai', field: 'dob' });
    }

    const doc = await Student.create({
      name: name.trim(),
      dob: dobDate,
      gender,
      currentGrade: String(currentGrade).trim(),
      parentId,
    });

    await ActivityLog.create({
      action: 'create',
      entity: 'student',
      entityId: doc._id,
      description: `Tạo học sinh: ${doc.name}`,
    });

    const populated = await Student.findById(doc._id).populate('parentId');
    res.status(201).json(populated);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { search, parentId, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) {
      filter.name = { $regex: search, $options: 'i' };
    }
    if (parentId) filter.parentId = parentId;

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Student.find(filter).populate('parentId').sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Student.countDocuments(filter),
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
    const doc = await Student.findById(req.params.id).populate('parentId');
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, dob, gender, current_grade, parent_id } = req.body;
    const update = {};
    if (name) { validateRequired(name, 'Họ tên'); update.name = name.trim(); }
    if (dob) update.dob = new Date(dob);
    if (gender) { validateGender(gender); update.gender = gender; }
    if (current_grade !== undefined) update.currentGrade = String(current_grade).trim();
    if (parent_id) {
      validateObjectId(parent_id, 'parentId');
      const parentExists = await Parent.findById(parent_id);
      if (!parentExists) return res.status(404).json({ success: false, error: 'Phụ huynh không tồn tại' });
      update.parentId = parent_id;
    }

    const doc = await Student.findByIdAndUpdate(req.params.id, update, { new: true }).populate('parentId');
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh' });

    await ActivityLog.create({
      action: 'update',
      entity: 'student',
      entityId: doc._id,
      description: `Cập nhật học sinh: ${doc.name}`,
    });

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await Student.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy học sinh' });

    await ActivityLog.create({
      action: 'delete',
      entity: 'student',
      entityId: doc._id,
      description: `Xoá học sinh: ${doc.name}`,
    });

    res.json({ success: true, message: 'Đã xoá học sinh' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
