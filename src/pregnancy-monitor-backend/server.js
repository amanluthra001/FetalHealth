require('dotenv').config(); // Loads your .env file
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

// --- NEW IMPORTS FOR ML INTEGRATION ---
const axios = require('axios');
const FormData = require('form-data');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// -----------------------------------------
// MONGODB CONNECTION
// -----------------------------------------
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('🟢 Connected to MongoDB Database!'))
  .catch((err) => console.error('🔴 MongoDB Connection Error:', err));

// -----------------------------------------
// DATABASE SCHEMA (The Blueprint)
// -----------------------------------------
const recordSchema = new mongoose.Schema({
    patientId: { type: String, default: 'PT-9921' }, // Hardcoded for now, dynamic later
    fileType: String, // 'ultrasound' or 'blood_report'
    fileName: String,
    filePath: String,
    uploadDate: { type: Date, default: Date.now },
    mlProcessed: { type: Boolean, default: false }, // Will turn true after Python model runs
    riskScore: { type: String, default: 'Pending' }
});

const MedicalRecord = mongoose.model('MedicalRecord', recordSchema);

// -----------------------------------------
// APPOINTMENT SCHEMA & MODEL
// -----------------------------------------
const appointmentSchema = new mongoose.Schema({
    patientId: { type: String, default: 'PT-9921' },
    doctor: String,
    specialty: String,
    date: String,
    time: String,
    type: String, // 'In-Person' or 'Telehealth'
    location: String,
    status: { type: String, default: 'Scheduled' }
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// -----------------------------------------
// MULTER CONFIGURATION (File Storage)
// -----------------------------------------
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'PT-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// -----------------------------------------
// ROUTES
// -----------------------------------------
app.get('/api/health', (req, res) => {
    res.json({ status: 'success', message: 'Backend is active.' });
});

// Updated Upload Route (Handles BOTH files and manual text entry)
app.post('/api/upload', upload.single('medicalFile'), async (req, res) => {
    try {
        const isManualEntry = req.body.entryType === 'manual_blood';
        
        if (!req.file && !isManualEntry) {
            return res.status(400).json({ error: 'No data provided.' });
        }

        // 1. Database Record Setup
        const fileCategory = isManualEntry ? 'manual_blood' : (req.file.mimetype.startsWith('image/') || req.file.originalname.endsWith('.dicom') ? 'ultrasound' : 'blood_report');
        
        const newRecord = new MedicalRecord({
            fileType: fileCategory,
            fileName: isManualEntry ? 'Manual Vitals Entry' : req.file.filename,
            filePath: isManualEntry ? 'N/A' : req.file.path
        });
        await newRecord.save();

        res.json({
            status: 'success',
            message: 'Data submitted. AI processing started.',
            recordId: newRecord._id,
            riskScore: newRecord.riskScore
        });

        // 2. Python Forwarding
        try {
            const formData = new FormData();
            formData.append('fileType', fileCategory);

            if (isManualEntry) {
                // Append all the text fields from the React form
                formData.append('Age', req.body.Age);
                formData.append('SystolicBP', req.body.SystolicBP);
                formData.append('DiastolicBP', req.body.DiastolicBP);
                formData.append('BS', req.body.BS);
                formData.append('BodyTemp', req.body.BodyTemp);
                formData.append('HeartRate', req.body.HeartRate);
            } else {
                formData.append('ultrasound', fs.createReadStream(req.file.path));
            }

            const pythonResponse = await axios.post('http://127.0.0.1:8000/analyze-risk', formData, {
                headers: formData.getHeaders()
            });

            newRecord.mlProcessed = true;
            newRecord.riskScore = pythonResponse.data.status; 
            await newRecord.save();

        } catch (mlError) {
            console.error("🔴 Error communicating with Python:", mlError.message);
        }

    } catch (error) {
        console.error("Upload error:", error);
        if (!res.headersSent) res.status(500).json({ error: 'Server error.' });
    }
});

// Get All Medical Records Route
app.get('/api/records', async (req, res) => {
    try {
        // Find all records and sort them by date (newest first)
        const records = await MedicalRecord.find().sort({ uploadDate: -1 });
        res.json(records);
    } catch (error) {
        console.error("Fetch error:", error);
        res.status(500).json({ error: 'Failed to fetch records' });
    }
});

// -----------------------------------------
// APPOINTMENT ROUTES
// -----------------------------------------
// Get all appointments
app.get('/api/appointments', async (req, res) => {
    try {
        const appointments = await Appointment.find();
        res.json(appointments);
    } catch (error) {
        console.error("Fetch appointments error:", error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});

// Book a new appointment
app.post('/api/appointments', async (req, res) => {
    try {
        const newAppointment = new Appointment(req.body);
        await newAppointment.save();
        res.json({ status: 'success', appointment: newAppointment });
    } catch (error) {
        console.error("Booking error:", error);
        res.status(500).json({ error: 'Failed to book appointment' });
    }
});

// -----------------------------------------
// START SERVER
// -----------------------------------------
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`=================================`);
});