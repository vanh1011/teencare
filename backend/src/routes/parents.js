const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const ActivityLog = require('../models/ActivityLog');
const { validateRequired, validateEmail, validatePhone } = require('../middleware/validate');

router.post('/', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    validateRequired(name, 'Họ tên');
    validatePhone(phone);
    validateEmail(email);

    const existingEmail = await Parent.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'Email đã tồn tại trong hệ thống', field: 'email' });
    }

    const doc = await Parent.create({ name: name.trim(), phone: phone.trim(), email: email.trim().toLowerCase() });

    await ActivityLog.create({
      action: 'create',
      entity: 'parent',
      entityId: doc._id,
      description: `Tạo phụ huynh: ${doc.name}`,
    });

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const { search, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      Parent.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Parent.countDocuments(filter),
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
    const doc = await Parent.findById(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy phụ huynh' });
    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { name, phone, email } = req.body;
    if (name) validateRequired(name, 'Họ tên');
    if (phone) validatePhone(phone);
    if (email) validateEmail(email);

    const update = {};
    if (name) update.name = name.trim();
    if (phone) update.phone = phone.trim();
    if (email) update.email = email.trim().toLowerCase();

    const doc = await Parent.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy phụ huynh' });

    await ActivityLog.create({
      action: 'update',
      entity: 'parent',
      entityId: doc._id,
      description: `Cập nhật phụ huynh: ${doc.name}`,
    });

    res.json(doc);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await Parent.findByIdAndDelete(req.params.id);
    if (!doc) return res.status(404).json({ success: false, error: 'Không tìm thấy phụ huynh' });

    await ActivityLog.create({
      action: 'delete',
      entity: 'parent',
      entityId: doc._id,
      description: `Xoá phụ huynh: ${doc.name}`,
    });

    res.json({ success: true, message: 'Đã xoá phụ huynh' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
