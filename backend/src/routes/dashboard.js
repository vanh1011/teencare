const express = require('express');
const router = express.Router();
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Subscription = require('../models/Subscription');
const ClassRegistration = require('../models/ClassRegistration');
const Attendance = require('../models/Attendance');
const ActivityLog = require('../models/ActivityLog');

router.get('/', async (_req, res, next) => {
  try {
    const now = new Date();

    const [
      totalParents,
      totalStudents,
      totalClasses,
      totalRegistrations,
      activeSubs,
      expiredSubs,
      recentActivities,
    ] = await Promise.all([
      Parent.countDocuments(),
      Student.countDocuments(),
      Class.countDocuments(),
      ClassRegistration.countDocuments(),
      Subscription.countDocuments({ endDate: { $gte: now } }),
      Subscription.countDocuments({ endDate: { $lt: now } }),
      ActivityLog.find({}).sort({ createdAt: -1 }).limit(10).lean(),
    ]);

    const subsByPackage = await Subscription.aggregate([
      { $match: { endDate: { $gte: now } } },
      { $group: { _id: '$packageName', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    const classesByDay = await Class.aggregate([
      { $group: { _id: '$dayOfWeek', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const todayAttendance = await Attendance.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
            $lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1),
          },
        },
      },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const revenueByMonth = await Subscription.aggregate([
      { $match: { price: { $gt: 0 } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$price' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]);

    res.json({
      stats: {
        totalParents,
        totalStudents,
        totalClasses,
        totalRegistrations,
        activeSubs,
        expiredSubs,
      },
      subsByPackage,
      classesByDay,
      todayAttendance,
      revenueByMonth,
      recentActivities,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
