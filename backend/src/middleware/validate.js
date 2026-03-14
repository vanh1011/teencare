const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^(0|\+84)\d{9,10}$/;
const TIME_SLOT_REGEX = /^\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}$/;
const VALID_GENDERS = ['male', 'female', 'other'];

class ValidationError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
    this.field = field;
  }
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const validateEmail = (email) => {
  if (!email) throw new ValidationError('Email là bắt buộc', 'email');
  if (!EMAIL_REGEX.test(email)) throw new ValidationError('Email không hợp lệ', 'email');
};

const validatePhone = (phone) => {
  if (!phone) throw new ValidationError('Số điện thoại là bắt buộc', 'phone');
  if (!PHONE_REGEX.test(phone.replace(/\s/g, '')))
    throw new ValidationError('Số điện thoại không hợp lệ (VD: 0901234567)', 'phone');
};

const validateGender = (gender) => {
  if (!gender) throw new ValidationError('Giới tính là bắt buộc', 'gender');
  if (!VALID_GENDERS.includes(gender))
    throw new ValidationError(`Giới tính phải là: ${VALID_GENDERS.join(', ')}`, 'gender');
};

const validateDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime())) throw new ValidationError('Ngày bắt đầu không hợp lệ', 'startDate');
  if (isNaN(end.getTime())) throw new ValidationError('Ngày kết thúc không hợp lệ', 'endDate');
  if (start >= end)
    throw new ValidationError('Ngày bắt đầu phải trước ngày kết thúc', 'startDate');
};

const validateTimeSlot = (timeSlot) => {
  if (!timeSlot) throw new ValidationError('Khung giờ là bắt buộc', 'timeSlot');
  if (!TIME_SLOT_REGEX.test(timeSlot))
    throw new ValidationError('Khung giờ không đúng định dạng (VD: 08:00 - 09:30)', 'timeSlot');
  const [startStr, endStr] = timeSlot.split('-').map((s) => s.trim());
  const toMin = (t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  };
  if (toMin(startStr) >= toMin(endStr))
    throw new ValidationError('Giờ bắt đầu phải trước giờ kết thúc', 'timeSlot');
};

const validateObjectId = (id, fieldName) => {
  if (!id) throw new ValidationError(`${fieldName} là bắt buộc`, fieldName);
  if (!isValidObjectId(id))
    throw new ValidationError(`${fieldName} không hợp lệ`, fieldName);
};

const validateRequired = (value, fieldName) => {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim()))
    throw new ValidationError(`${fieldName} là bắt buộc`, fieldName);
};

const validateDayOfWeek = (day) => {
  const d = Number(day);
  if (isNaN(d) || d < 0 || d > 6)
    throw new ValidationError('dayOfWeek phải từ 0 (CN) đến 6 (T7)', 'dayOfWeek');
};

const validateMaxStudents = (max) => {
  const n = Number(max);
  if (isNaN(n) || n < 1)
    throw new ValidationError('Sĩ số tối đa phải >= 1', 'maxStudents');
};

module.exports = {
  ValidationError,
  isValidObjectId,
  validateEmail,
  validatePhone,
  validateGender,
  validateDateRange,
  validateTimeSlot,
  validateObjectId,
  validateRequired,
  validateDayOfWeek,
  validateMaxStudents,
};
