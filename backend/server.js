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

app.use(cors());
app.use(express.json());
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
    specialty: { type: String, required: true },
    qualification: { type: String, default: 'MBBS' },
    hospital: { type: String, default: 'D.I. Khan' },
    fee: { type: Number, default: 1500 },
    timing: { type: String, default: '09:00 AM - 05:00 PM' },
    image: { type: String, default: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80' },
  },
  { timestamps: true }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientName: { type: String, required: true },
    patientPhone: { type: String, required: true },
    doctorId: { type: String, required: true },
    doctorName: { type: String, required: true },
    date: { type: String, required: true },
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
    const { name, email, password, phone, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    const normalizedRole = ['Patient', 'Doctor', 'Admin'].includes(role) ? role : 'Patient';

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email address.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone: phone || '',
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

    const user = await User.findOne({ email: String(email).toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const requestedRole = role || user.role;
    if (requestedRole && user.role !== requestedRole && requestedRole !== user.role) {
      return res.status(403).json({ message: 'Role mismatch for this account.' });
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      message: `${user.role} login successful.`,
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
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error while logging in.' });
  }
});

app.get('/api/doctors', async (req, res) => {
  try {
    const doctors = await Doctor.find({}).sort({ createdAt: -1 });
    return res.json(doctors);
  } catch (error) {
    console.error('Get doctors error:', error);
    return res.status(500).json({ message: 'Unable to fetch doctors.' });
  }
});

app.post('/api/doctors', async (req, res) => {
  try {
    const { name, specialty, qualification, hospital, fee, timing, image } = req.body;

    if (!name || !specialty) {
      return res.status(400).json({ message: 'Doctor name and specialty are required.' });
    }

    const doctor = await Doctor.create({
      name,
      specialty,
      qualification: qualification || 'MBBS',
      hospital: hospital || 'D.I. Khan',
      fee: Number(fee || 1500),
      timing: timing || '09:00 AM - 05:00 PM',
      image: image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=700&q=80',
    });

    return res.status(201).json({ message: 'Doctor added successfully.', doctor });
  } catch (error) {
    console.error('Create doctor error:', error);
    return res.status(500).json({ message: 'Unable to add doctor.' });
  }
});

app.post('/api/appointments', async (req, res) => {
  try {
    const { patientName, patientPhone, doctorId, doctorName, date, status } = req.body;

    if (!patientName || !patientPhone || !doctorId || !doctorName || !date) {
      return res.status(400).json({ message: 'Missing appointment details.' });
    }

    const appointment = await Appointment.create({
      patientName,
      patientPhone,
      doctorId,
      doctorName,
      date,
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

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.listen(PORT, () => {
  console.log(`Doctor Q server running on http://localhost:${PORT}`);
});
