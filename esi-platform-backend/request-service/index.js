// request-service/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = 3002;

// --- BAGIAN YANG DIPERBAIKI ---
// Sekarang kita sertakan konfigurasi lengkap dari file .env
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// --- Middleware untuk Autentikasi Token ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

const authorizeAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak. Hanya untuk admin.' });
    }
    next();
};

const authorizeStaff = (req, res, next) => {
    const allowedRoles = ['admin', 'technician'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }
    next();
};

const staffOnly = [authenticateToken, authorizeStaff];


// ======== ENDPOINT SERVICE REQUEST (Semua terproteksi) ========

// Endpoint untuk MEMBUAT permintaan layanan baru
app.post('/request', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { details } = req.body;

    if (!details || !details.request_type || !details.location || !details.preferred_date) {
        return res.status(400).json({ message: 'Detail permintaan tidak lengkap.' });
    }

    try {
        const query = `
            INSERT INTO ServiceRequests (userId, type, location, preferredDate, status)
            VALUES ($1, $2, $3, $4, 'Requested')
            RETURNING requestId, status, createdAt;
        `;
        const result = await pool.query(query, [userId, details.request_type, details.location, details.preferred_date]);

        res.status(201).json({ message: 'Permintaan layanan berhasil dibuat.', request: result.rows[0] });
    } catch (error) {
        console.error('Error saat membuat permintaan layanan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Endpoint untuk MENGAMBIL SEMUA permintaan layanan milik pengguna
app.get('/requests', authenticateToken, async (req, res) => {
    const { userId } = req.user;

    try {
        const query = 'SELECT requestId, type, location, status, preferredDate, createdAt FROM ServiceRequests WHERE userId = $1 ORDER BY createdAt DESC';
        const result = await pool.query(query, [userId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error saat mengambil permintaan layanan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Endpoint untuk mengambil SEMUA permintaan yang perlu dijadwalkan (hanya admin)
app.get('/requests/pending', [authenticateToken, authorizeAdmin], async (req, res) => {
    try {
        // Ambil semua request yang statusnya 'Requested'
        const query = `
            SELECT sr.requestId, sr.type, sr.location, up.name as customer_name 
            FROM ServiceRequests sr
            JOIN UserProfiles up ON sr.userId = up.userId
            WHERE sr.status = 'Requested' ORDER BY sr.createdAt ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat mengambil permintaan tertunda:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Ganti nama endpoint dan perbarui query SQL-nya
app.get('/requests/active', [authenticateToken, authorizeAdmin], async (req, res) => {
    try {
        // Ambil semua request yang statusnya BUKAN 'Selesai' atau 'Dibatalkan'
        const query = `
            SELECT sr.requestId, sr.type, sr.location, up.name as customer_name 
            FROM ServiceRequests sr
            JOIN UserProfiles up ON sr.userId = up.userId
            WHERE sr.status IN ('Requested', 'Scheduled') 
            ORDER BY sr.createdAt ASC
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat mengambil permintaan aktif:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

app.get('/requests/scheduled', staffOnly, async (req, res) => {
    try {
        // Query ini HANYA mengambil permintaan yang statusnya 'Scheduled'
        const query = `
            SELECT sr.requestId, sr.type, sr.location, up.name as customer_name 
            FROM ServiceRequests sr
            JOIN UserProfiles up ON sr.userId = up.userId
            WHERE sr.status = 'Scheduled'
            ORDER BY sr.createdAt ASC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat mengambil permintaan terjadwal:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});


app.listen(PORT, () => {
    console.log(`✅ Microservice 'request-service' berjalan di http://localhost:${PORT}`);
});