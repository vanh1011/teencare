/**
 * API Validation & Business Rules – bộ test theo checklist README 4.6
 * Chạy: npm run test (cần MongoDB đang chạy, mặc định teenup_test)
 */
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const Parent = require('../src/models/Parent');
const Student = require('../src/models/Student');
const Class = require('../src/models/Class');
const ClassRegistration = require('../src/models/ClassRegistration');
const Subscription = require('../src/models/Subscription');
const SubscriptionPackage = require('../src/models/SubscriptionPackage');

const MONGODB_URI = process.env.MONGODB_URI_TEST || process.env.MONGODB_URI || 'mongodb://localhost:27017/teenup_test';

beforeAll(async () => {
  if (mongoose.connection.readyState !== 1) await mongoose.connect(MONGODB_URI);
});

afterAll(async () => {
  await mongoose.disconnect();
});

async function clearCollections() {
  await Parent.deleteMany({});
  await Student.deleteMany({});
  await Class.deleteMany({});
  await ClassRegistration.deleteMany({});
  await Subscription.deleteMany({});
  await SubscriptionPackage.deleteMany({});
}

describe('API Validation & Business Rules', () => {
  beforeEach(async () => {
    await clearCollections();
  });

  describe('GET /api/parents/:id', () => {
    it('returns 404 when id does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/parents/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/phụ huynh|parent not found/i);
    });
  });

  describe('POST /api/students', () => {
    it('returns 400 when parent_id is missing or invalid', async () => {
      const res = await request(app)
        .post('/api/students')
        .send({
          name: 'Test',
          dob: '2015-01-01',
          gender: 'male',
          current_grade: '4',
        });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/students/:id', () => {
    it('returns 404 when student id does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/students/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/học sinh|student not found/i);
    });
  });

  describe('POST /api/classes/:classId/register', () => {
    it('returns 400 when student_id is missing', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const cls = await Class.create({
        name: 'C',
        subject: 'X',
        dayOfWeek: 1,
        timeSlot: '09:00 - 10:00',
        teacherName: 'T',
        maxStudents: 10,
      });
      const pkg = await SubscriptionPackage.create({
        key: 'test_pkg',
        name: 'Test',
        price: 1000,
        totalSessions: 5,
        benefits: [],
      });
      await Subscription.create({
        studentId: student._id,
        packageId: pkg._id,
        packageName: 'Test',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSessions: 5,
        usedSessions: 0,
      });

      const res = await request(app)
        .post(`/api/classes/${cls._id}/register`)
        .send({});
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/student_id|studentId|bắt buộc|required/i);
    });

    it('returns 404 when classId does not exist', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const fakeClassId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/classes/${fakeClassId}/register`)
        .send({ student_id: student._id.toString() });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/lớp|class not found/i);
    });

    it('returns 404 when studentId does not exist', async () => {
      const cls = await Class.create({
        name: 'C',
        subject: 'X',
        dayOfWeek: 1,
        timeSlot: '09:00 - 10:00',
        teacherName: 'T',
        maxStudents: 10,
      });
      const fakeStudentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/classes/${cls._id}/register`)
        .send({ student_id: fakeStudentId.toString() });
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/học sinh|student not found/i);
    });

    it('returns 400 when class is full (max_students reached)', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student1 = await Student.create({
        name: 'S1',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const student2 = await Student.create({
        name: 'S2',
        dob: new Date(),
        gender: 'female',
        currentGrade: '4',
        parentId: parent._id,
      });
      const cls = await Class.create({
        name: 'C',
        subject: 'X',
        dayOfWeek: 1,
        timeSlot: '09:00 - 10:00',
        teacherName: 'T',
        maxStudents: 1,
      });
      const pkg = await SubscriptionPackage.create({
        key: 'p',
        name: 'P',
        price: 1000,
        totalSessions: 5,
        benefits: [],
      });
      await Subscription.create({
        studentId: student1._id,
        packageId: pkg._id,
        packageName: 'P',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSessions: 5,
        usedSessions: 0,
      });
      await Subscription.create({
        studentId: student2._id,
        packageId: pkg._id,
        packageName: 'P',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSessions: 5,
        usedSessions: 0,
      });
      await ClassRegistration.create({ classId: cls._id, studentId: student1._id });

      const res = await request(app)
        .post(`/api/classes/${cls._id}/register`)
        .send({ student_id: student2._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/sĩ số tối đa/i);
    });

    it('returns 400 when student already registered for this class', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const cls = await Class.create({
        name: 'C',
        subject: 'X',
        dayOfWeek: 1,
        timeSlot: '09:00 - 10:00',
        teacherName: 'T',
        maxStudents: 10,
      });
      const pkg = await SubscriptionPackage.create({
        key: 'p',
        name: 'P',
        price: 1000,
        totalSessions: 5,
        benefits: [],
      });
      await Subscription.create({
        studentId: student._id,
        packageId: pkg._id,
        packageName: 'P',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSessions: 5,
        usedSessions: 0,
      });
      await ClassRegistration.create({ classId: cls._id, studentId: student._id });

      const res = await request(app)
        .post(`/api/classes/${cls._id}/register`)
        .send({ student_id: student._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/đã đăng ký lớp này/i);
    });

    it('returns 400 when no valid subscription (expired or no sessions left)', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const cls = await Class.create({
        name: 'C',
        subject: 'X',
        dayOfWeek: 1,
        timeSlot: '09:00 - 10:00',
        teacherName: 'T',
        maxStudents: 10,
      });
      const res = await request(app)
        .post(`/api/classes/${cls._id}/register`)
        .send({ student_id: student._id.toString() });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/gói học còn hiệu lực|hết buổi/i);
    });
  });

  describe('DELETE /api/registrations/:id', () => {
    it('returns 404 when registration id does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).delete(`/api/registrations/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/đăng ký|registration not found/i);
    });
  });

  describe('POST /api/subscriptions', () => {
    it('returns 400 when student_id is missing', async () => {
      await SubscriptionPackage.create({
        key: 'hoc_tap',
        name: 'Học tập',
        price: 1200000,
        totalSessions: 5,
        benefits: [],
      });
      const res = await request(app)
        .post('/api/subscriptions')
        .send({
          package_key: 'hoc_tap',
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/student_id|studentId|bắt buộc/i);
    });

    it('returns 400 when package_key does not exist', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const res = await request(app)
        .post('/api/subscriptions')
        .send({
          student_id: student._id.toString(),
          package_key: 'invalid_key',
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Gói không tồn tại|invalid_key/i);
    });

    it('returns 400 when student already has same package active (duplicate)', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const pkg = await SubscriptionPackage.create({
        key: 'hoc_tap',
        name: 'Học tập',
        price: 1200000,
        totalSessions: 5,
        benefits: [],
      });
      await Subscription.create({
        studentId: student._id,
        packageId: pkg._id,
        packageName: 'Học tập',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSessions: 5,
        usedSessions: 0,
      });

      const res = await request(app)
        .post('/api/subscriptions')
        .send({
          student_id: student._id.toString(),
          package_key: 'hoc_tap',
          start_date: new Date().toISOString().slice(0, 10),
          end_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/còn hiệu lực|đăng ký trùng/i);
    });
  });

  describe('GET /api/subscriptions/:id', () => {
    it('returns 404 when subscription id does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/subscriptions/${fakeId}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/gói đăng ký|subscription not found|Không tìm thấy/i);
    });
  });

  describe('PATCH /api/subscriptions/:id/use', () => {
    it('returns 404 when subscription id does not exist', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).patch(`/api/subscriptions/${fakeId}/use`);
      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/gói đăng ký|subscription not found|Không tìm thấy/i);
    });

    it('returns 400 when package has totalSessions = 0 (cannot use)', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const sub = await Subscription.create({
        studentId: student._id,
        packageName: 'Chăm sóc',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSessions: 0,
        usedSessions: 0,
      });
      const res = await request(app).patch(`/api/subscriptions/${sub._id}/use`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/không tính theo buổi/i);
    });

    it('returns 400 when package already used all sessions', async () => {
      const parent = await Parent.create({ name: 'P', phone: '0901234567', email: 'e@e.com' });
      const student = await Student.create({
        name: 'S',
        dob: new Date(),
        gender: 'male',
        currentGrade: '4',
        parentId: parent._id,
      });
      const sub = await Subscription.create({
        studentId: student._id,
        packageName: 'Học tập',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        totalSessions: 5,
        usedSessions: 5,
      });
      const res = await request(app).patch(`/api/subscriptions/${sub._id}/use`);
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/hết buổi/i);
    });
  });

  describe('Health', () => {
    it('GET /api/health returns 200 and { ok: true }', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.ok).toBe(true);
    });
  });
});
