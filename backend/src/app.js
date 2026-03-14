const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const parentRoutes = require('./routes/parents');
const studentRoutes = require('./routes/students');
const classRoutes = require('./routes/classes');
const packageRoutes = require('./routes/packages');
const subscriptionRoutes = require('./routes/subscriptions');
const registrationRoutes = require('./routes/registrations');
const dashboardRoutes = require('./routes/dashboard');
const attendanceRoutes = require('./routes/attendance');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/parents', parentRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);

app.get('/api/health', (_, res) => res.json({ ok: true }));

app.use(errorHandler);

module.exports = app;
