const mongoose = require('mongoose');
const Parent = require('./models/Parent');
const Student = require('./models/Student');
const Class = require('./models/Class');
const Subscription = require('./models/Subscription');
const SubscriptionPackage = require('./models/SubscriptionPackage');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/teenup';

const run = async () => {
  await mongoose.connect(MONGODB_URI);

  await SubscriptionPackage.deleteMany({});
  await SubscriptionPackage.insertMany([
    {
      key: 'hoc_tap',
      name: 'Học tập',
      price: 1200000,
      originalPrice: null,
      totalSessions: 5,
      benefits: [
        'Lớp KNS và GDGT',
        '1 buổi Mentor 1:1',
        'Lớp thể chất hàng tuần',
      ],
      isPopular: false,
    },
    {
      key: 'huan_luyen',
      name: 'Huấn luyện',
      price: 1875000,
      originalPrice: 2500000,
      totalSessions: 24,
      benefits: [
        'Lớp KNS và GDGT',
        '4 buổi Mentor 1:1',
        '20 buổi luyện tập thể chất',
        'Giáo trình "34 thói quen của bạn trẻ thành đạt"',
        'Mentor hỗ trợ trực tiếp',
        'Báo cáo chuyên sâu',
      ],
      isPopular: true,
    },
    {
      key: 'cham_soc',
      name: 'Chăm sóc',
      price: 5000000,
      originalPrice: null,
      totalSessions: 0,
      benefits: [
        'Thẻ khám bệnh tại hệ thống 315 toàn quốc',
        'Khám dinh dưỡng định kỳ',
        'Gói canxi tăng chiều cao',
        'Gói vitamin Midu Menaq7',
        'Gói tiêm HPV Gardasil-7',
      ],
      isPopular: false,
    },
  ]);

  await Parent.deleteMany({});
  await Student.deleteMany({});
  await Class.deleteMany({});
  await mongoose.connection.collection('classregistrations').deleteMany({});
  await Subscription.deleteMany({});

  const [p1, p2] = await Parent.insertMany([
    { name: 'Nguyễn Văn A', phone: '0901234567', email: 'nguyenvana@email.com' },
    { name: 'Trần Thị B', phone: '0912345678', email: 'tranthib@email.com' },
  ]);

  const [s1, s2, s3] = await Student.insertMany([
    { name: 'Nguyễn An', dob: new Date('2015-05-10'), gender: 'male', currentGrade: '4', parentId: p1._id },
    { name: 'Nguyễn Bình', dob: new Date('2014-08-22'), gender: 'male', currentGrade: '5', parentId: p1._id },
    { name: 'Trần Minh', dob: new Date('2015-01-15'), gender: 'female', currentGrade: '4', parentId: p2._id },
  ]);

  await Class.insertMany([
    { name: 'Toán 4A', subject: 'Toán', dayOfWeek: 1, timeSlot: '09:00-10:30', teacherName: 'Trần Thị C', maxStudents: 15 },
    { name: 'Văn 4', subject: 'Văn', dayOfWeek: 1, timeSlot: '14:00-15:30', teacherName: 'Lê Văn D', maxStudents: 12 },
    { name: 'Anh 4', subject: 'Tiếng Anh', dayOfWeek: 3, timeSlot: '09:00-10:30', teacherName: 'Phạm Thị E', maxStudents: 10 },
  ]);

  const pkgHuanLuyen = await SubscriptionPackage.findOne({ key: 'huan_luyen' });
  await Subscription.insertMany([
    { studentId: s1._id, packageId: pkgHuanLuyen?._id, packageName: 'Huấn luyện', price: 1875000, startDate: new Date('2025-03-01'), endDate: new Date('2025-06-01'), totalSessions: 24, usedSessions: 0 },
    { studentId: s2._id, packageName: 'Học tập', price: 1200000, startDate: new Date('2025-03-01'), endDate: new Date('2025-05-01'), totalSessions: 5, usedSessions: 2 },
  ]);

  console.log('Seed done: 3 packages, 2 parents, 3 students, 3 classes, 2 subscriptions');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
