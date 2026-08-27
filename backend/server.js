const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { MongoMemoryServer } = require('mongodb-memory-server');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/doctorq';
const JWT_SECRET = process.env.JWT_SECRET || 'doctorq-secret-key';
const SUPER_ADMIN_EMAIL = 'muhammadsadaf010@gmail.com';
const SUPER_ADMIN_PASSWORD = 'Sadaf@9099';

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: '' },
    role: { type: String, enum: ['Patient', 'Doctor', 'Admin'], default: 'Patient' },
  },
  { timestamps: true }
);

const doctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    userId: { type: String, default: '' },
    specialty: { type: String, required: true },
    qualification: { type: String, default: 'MBBS' },
    hospital: { type: String, default: 'D.I. Khan' },
    fee: { type: Number, default: 1500 },
    timing: { type: String, default: '09:00 AM - 05:00 PM' },
    image: { type: String, default: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80' },
    webhookUrl: { type: String, default: '' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    patientEmail: { type: String, default: '' },
    patientId: { type: String, default: '' },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    specialty: { type: String, default: '' },
    hospital: { type: String, default: '' },
    date: { type: String, required: true },
    timeSlot: { type: String, default: '' },
    gender: { type: String, default: '' },
    appointmentType: { type: String, default: 'In-Clinic Visit' },
    problem: { type: String, default: '' },
    status: { type: String, default: 'Pending' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
const Doctor = mongoose.model('Doctor', doctorSchema);
const Appointment = mongoose.model('Appointment', appointmentSchema);

const connectToDatabase = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.warn('Primary MongoDB connection failed, trying in-memory fallback...');
    try {
      const mongoMemoryServer = await MongoMemoryServer.create();
      const memoryUri = mongoMemoryServer.getUri();
      await mongoose.connect(memoryUri);
      console.log('MongoDB connected successfully via in-memory fallback');
    } catch (memoryError) {
      console.error('MongoDB connection error:', memoryError.message);
    }
  }
};

connectToDatabase();

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Doctor Q API is running.' });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, fullName, email, password, phone, phoneNumber, role } = req.body;

    const accountName = name || fullName;
    if (!accountName || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedRole = ['Patient', 'Doctor', 'Admin'].find((allowedRole) => allowedRole.toLowerCase() === String(role || '').toLowerCase()) || 'Patient';

    if (normalizedRole === 'Admin') {
      return res.status(403).json({ message: 'Admin registration is restricted to the Super Admin.' });
    }
    if (normalizedRole === 'Doctor') {
      return res.status(403).json({ message: 'Doctor accounts are created by an administrator.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: accountName,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || phoneNumber || '',
      role: normalizedRole,
    });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      message: `${normalizedRole} account created successfully.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error while registering user.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (String(email).toLowerCase() === SUPER_ADMIN_EMAIL &&
        String(password) === SUPER_ADMIN_PASSWORD &&
        String(role || '').toLowerCase() === 'admin') {
      const token = jwt.sign({ id: 'super-admin', role: 'Admin' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        message: 'Super Admin login successful. Admin Dashboard access granted.',
        token,
        user: {
          id: 'super-admin',
          name: 'Super Admin',
          email: SUPER_ADMIN_EMAIL,
          phone: '',
          role: 'Admin',
        },
      });
    }

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const requestedRole = role
      ? ['Patient', 'Doctor', 'Admin'].find((allowedRole) => allowedRole.toLowerCase() === String(role).toLowerCase())
      : user.role;
    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({ message: 'Role mismatch for this account.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    const linkedDoctor = user.role === 'Doctor' ? await Doctor.findOne({ email: user.email }).select('_id') : null;

    return res.json({
      message: `${user.role} login successful.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        doctorId: linkedDoctor ? String(linkedDoctor._id) : undefined,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error while logging in.' });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const filter = {};
    if (String(req.query.includeInactive).toLowerCase() !== 'true') filter.active = { $ne: false };
    if (req.query.specialty) filter.specialty = { $regex: String(req.query.specialty), $options: 'i' };
    if (req.query.area) filter.$or = [
      { hospital: { $regex: String(req.query.area), $options: 'i' } },
      { name: { $regex: String(req.query.area), $options: 'i' } },
    ];
    const doctors = await Doctor.find(filter).sort({ createdAt: -1 });
    return res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    return res.status(500).json({ message: 'Unable to fetch doctors.' });
  }
});

app.get('/api/doctors/search', async (req, res) => {
  try {
    const terms = [{ active: { $ne: false } }];
    if (req.query.specialty) terms.push({ specialty: { $regex: String(req.query.specialty), $options: 'i' } });
    if (req.query.area) terms.push({ hospital: { $regex: String(req.query.area), $options: 'i' } });
    const doctors = await Doctor.find(terms.length ? { $and: terms } : {}).sort({ createdAt: -1 });
    return res.json(doctors);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to search doctors.' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const { name, specialty, qualification, hospital, fee, timing, timings, image, email, password, phone, active, webhookUrl } = req.body;

    if (!name || !specialty) {
      return res.status(400).json({ message: 'Doctor name and specialty are required.' });
    }

    const doctorEmail = String(email || `${name.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/(^\.|\.$)/g, '')}@doctorq.pk`).toLowerCase();
    let credentialEmail = doctorEmail;
    let duplicateIndex = 1;
    while (await User.exists({ email: credentialEmail })) {
      credentialEmail = doctorEmail.replace('@', `${duplicateIndex++}@`);
    }
    const temporaryPassword = password || `DQ-${Math.random().toString(36).slice(2, 8).toUpperCase()}!`;
    const doctor = await Doctor.create({
      name,
      email: credentialEmail,
      phone: phone || '',
      specialty,
      qualification: qualification || 'MBBS',
      hospital: hospital || 'D.I. Khan',
      fee: Number(fee || 1500),
      timing: timing || timings || '09:00 AM - 05:00 PM',
      image: image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80',
      webhookUrl: webhookUrl || '',
      active: !['false', '0', 'inactive'].includes(String(active).toLowerCase()),
    });

    const doctorUser = await User.create({
      name,
      email: credentialEmail,
      password: await bcrypt.hash(temporaryPassword, 10),
      phone: phone || '',
      role: 'Doctor',
    });
    await Doctor.updateOne({ _id: doctor._id }, { userId: String(doctorUser._id) });

    return res.status(201).json({
      message: 'Doctor added successfully.',
      doctor: { ...doctor.toObject(), userId: String(doctorUser._id) },
      credentials: { email: credentialEmail, password: temporaryPassword },
    });
  } catch (error) {
    console.error('Create doctor error:', error);
    return res.status(500).json({ message: 'Unable to add doctor.' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const {
      patientName, fullName, patientPhone, mobileNumber, doctorId, doctorName, date,
      preferredDate, status, patientEmail, patientId, specialty, hospital, timeSlot,
      gender, appointmentType, problem, description,
    } = req.body;
    const resolvedPatientName = patientName || fullName;
    const resolvedPatientPhone = patientPhone || mobileNumber;
    const resolvedDate = date || preferredDate;

    if (!resolvedPatientName || !resolvedPatientPhone || !doctorId || !doctorName || !resolvedDate) {
      return res.status(400).json({ message: 'Missing appointment details.' });
    }

    const appointment = await Appointment.create({
      patientName: resolvedPatientName,
      patientPhone: resolvedPatientPhone,
      patientEmail: patientEmail || '',
      patientId: patientId || '',
      doctorId,
      doctorName,
      specialty: specialty || '',
      hospital: hospital || '',
      date: resolvedDate,
      timeSlot: timeSlot || '',
      gender: gender || '',
      appointmentType: appointmentType || 'In-Clinic Visit',
      problem: problem || description || '',
      status: status || 'Pending',
    });

    return res.status(201).json({
      message: 'Appointment booked successfully.',
      appointment,
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ message: 'Unable to create appointment.' });
  }
});

app.get('/api/appointments', async (req, res) => {
  try {
    const filter = {};
    if (req.query.doctorId) filter.doctorId = String(req.query.doctorId);
    if (req.query.patientId) filter.patientId = String(req.query.patientId);
    if (req.query.patientEmail) filter.patientEmail = String(req.query.patientEmail).toLowerCase();
    const appointments = await Appointment.find(filter).sort({ createdAt: -1 });
    return res.json(appointments);
  } catch (error) {
    console.error('Get appointments error:', error);
    return res.status(500).json({ message: 'Unable to fetch appointments.' });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const [doctors, patients, pendingAppointments, totalAppointments] = await Promise.all([
      Doctor.countDocuments(),
      User.countDocuments({ role: 'Patient' }),
      Appointment.countDocuments({ status: 'Pending' }),
      Appointment.countDocuments(),
    ]);
    return res.json({ doctors, patients, pendingAppointments, totalAppointments });
  } catch (error) {
    return res.status(500).json({ message: 'Unable to fetch dashboard statistics.' });
  }
});

app.patch('/api/appointments/:id', async (req, res) => {
  try {
    const allowed = ['status', 'date', 'timeSlot', 'problem', 'notes'];
    const changes = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) changes[key] = req.body[key];
    });
    if (changes.status) {
      const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled', 'Rejected'];
      const normalizedStatus = validStatuses.find((value) => value.toLowerCase() === String(changes.status).toLowerCase());
      if (!normalizedStatus) return res.status(400).json({ message: 'Invalid appointment status.' });
      changes.status = normalizedStatus;
    }
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    return res.json({ message: 'Appointment updated successfully.', appointment });
  } catch (error) {
    console.error('Update appointment error:', error);
    return res.status(400).json({ message: 'Unable to update appointment.' });
  }
});

app.delete('/api/appointments/:id', async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndDelete(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found.' });
    return res.json({ message: 'Appointment deleted successfully.' });
  } catch (error) {
    console.error('Delete appointment error:', error);
    return res.status(400).json({ message: 'Unable to delete appointment.' });
  }
});

app.put('/api/doctors/:id', async (req, res) => {
  try {
    const allowed = ['name', 'email', 'phone', 'specialty', 'qualification', 'hospital', 'fee', 'timing', 'timings', 'image', 'active', 'webhookUrl'];
    const changes = {};
    allowed.forEach((key) => {
      if (req.body[key] !== undefined) changes[key] = key === 'fee'
        ? Number(req.body[key])
        : key === 'active'
          ? !['false', '0', 'inactive'].includes(String(req.body[key]).toLowerCase())
          : req.body[key];
    });
    if (changes.timings !== undefined && changes.timing === undefined) changes.timing = changes.timings;
    delete changes.timings;
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, changes, { new: true, runValidators: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    if (changes.name || changes.email || changes.phone) {
      await User.findOneAndUpdate(
        { _id: doctor.userId },
        { ...(changes.name ? { name: changes.name } : {}), ...(changes.email ? { email: changes.email } : {}), ...(changes.phone ? { phone: changes.phone } : {}) }
      );
    }
    return res.json({ message: 'Doctor updated successfully.', doctor });
  } catch (error) {
    console.error('Update doctor error:', error);
    return res.status(400).json({ message: 'Unable to update doctor.' });
  }
});

app.delete('/api/doctors/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
    if (doctor.userId) await User.findByIdAndDelete(doctor.userId);
    return res.json({ message: 'Doctor deleted successfully.' });
  } catch (error) {
    console.error('Delete doctor error:', error);
    return res.status(400).json({ message: 'Unable to delete doctor.' });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Doctor Q server running on http://localhost:${PORT}`);
});
