// schedule-service/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = 3003;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// --- Middleware ---
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

// ======== ENDPOINT SCHEDULE SERVICE ========

// Endpoint untuk menugaskan teknisi ke sebuah permintaan (hanya admin)
app.post('/assign', [authenticateToken, authorizeAdmin], async (req, res) => {
    const { requestId, technicianId, scheduledDate } = req.body;
    if (!requestId || !technicianId || !scheduledDate) {
        return res.status(400).json({ message: 'Input tidak lengkap.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const scheduleQuery = `
            INSERT INTO Schedules (requestId, technicianId, scheduledDate) 
            VALUES ($1, $2, $3) RETURNING scheduleId;
        `;
        await client.query(scheduleQuery, [requestId, technicianId, scheduledDate]);

        const updateRequestQuery = `
            UPDATE ServiceRequests SET status = 'Scheduled' WHERE requestId = $1;
        `;
        await client.query(updateRequestQuery, [requestId]);

        await client.query('COMMIT');
        res.status(201).json({ message: `Teknisi berhasil ditugaskan untuk permintaan ${requestId}.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat membuat jadwal:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        client.release();
    }
});

// Endpoint untuk melihat semua jadwal (hanya admin)
app.get('/', [authenticateToken, authorizeAdmin], async (req, res) => {
    try {
        const query = `
    SELECT 
        s.scheduleId, 
        sr.requestId, 
        s.status as schedule_status, 
        s.scheduledDate, 
        sr.type, 
        sr.status as request_status, -- Ambil status dari ServiceRequest
        up_tech.name as technician_name, 
        up_tech.userId as technicianId, 
        up_cust.organization as customer_name
    FROM Schedules s
    JOIN ServiceRequests sr ON s.requestId = sr.requestId
    JOIN UserProfiles up_tech ON s.technicianId = up_tech.userId
    JOIN UserProfiles up_cust ON sr.userId = up_cust.userId
    ORDER BY s.scheduledDate DESC;
`;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error saat mengambil jadwal:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// --- ENDPOINT BARU UNTUK EDIT/UPDATE JADWAL ---
app.put('/:scheduleId', [authenticateToken, authorizeAdmin], async (req, res) => {
    const { scheduleId } = req.params;
    const { technicianId, scheduledDate } = req.body;

    if (!technicianId || !scheduledDate) {
        return res.status(400).json({ message: 'ID Teknisi dan Tanggal wajib diisi.' });
    }

    try {
        const query = `
            UPDATE Schedules SET technicianId = $1, scheduledDate = $2 
            WHERE scheduleId = $3 RETURNING *;
        `;
        const result = await pool.query(query, [technicianId, scheduledDate, scheduleId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Jadwal tidak ditemukan.' });
        }
        res.status(200).json({ message: 'Jadwal berhasil diperbarui.', schedule: result.rows[0] });
    } catch (error) {
        console.error('Error saat update jadwal:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// --- ENDPOINT BARU UNTUK HAPUS/BATALKAN JADWAL ---
app.delete('/:scheduleId', [authenticateToken, authorizeAdmin], async (req, res) => {
    const { scheduleId } = req.params;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Ambil requestId sebelum menghapus jadwal
        const scheduleResult = await client.query('SELECT requestId FROM Schedules WHERE scheduleId = $1', [scheduleId]);
        if (scheduleResult.rows.length === 0) {
            throw new Error('Jadwal tidak ditemukan.');
        }
        const { requestid } = scheduleResult.rows[0];

        // 1. Hapus jadwal dari tabel Schedules
        await client.query('DELETE FROM Schedules WHERE scheduleId = $1', [scheduleId]);

        // 2. Kembalikan status di ServiceRequests menjadi 'Requested'
        await client.query(`UPDATE ServiceRequests SET status = 'Requested' WHERE requestId = $1`, [requestid]);

        await client.query('COMMIT');
        res.status(200).json({ message: `Jadwal ${scheduleId} berhasil dibatalkan dan dikembalikan ke antrian.` });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat membatalkan jadwal:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        client.release();
    }
});


app.listen(PORT, () => {
    console.log(`✅ Microservice 'schedule-service' berjalan di http://localhost:${PORT}`);
});