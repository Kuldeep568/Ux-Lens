require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS ────────────────────────────────────────────────────────
// CLIENT_URL supports a comma-separated list of allowed origins
// e.g. "https://uxlens.vercel.app,http://localhost:5173"
const rawOrigins = process.env.CLIENT_URL || 'http://localhost:5173,http://localhost:3000';
const allowedOrigins = rawOrigins.split(',').map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (curl, Postman, mobile apps)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        callback(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Routes ──────────────────────────────────────────────────────
app.use('/api/review', require('./routes/review'));
app.use('/api/reviews', require('./routes/review'));
app.use('/api/status', require('./routes/status'));

// Health ping (Render uses this to check if the service is up)
app.get('/', (req, res) => {
    res.json({
        message: 'UX Reviewer API is running 🚀',
        version: '1.0.0',
        env: process.env.NODE_ENV || 'development',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found.` });
});

// Error handler
app.use(errorHandler);

// ── MongoDB + Start ─────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ux-reviewer';

mongoose
    .connect(MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected');
        app.listen(PORT, () => {
            console.log(`🚀 Server running on port ${PORT}`);
        });
    })
    .catch((err) => {
        console.error('❌ MongoDB connection failed:', err.message);
        process.exit(1);
    });
