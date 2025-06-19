// lab-data-service/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = 3004;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// --- Middleware (diasumsikan sudah ada di file Anda) ---
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

const authorizeStaff = (req, res, next) => {
    const allowedRoles = ['admin', 'technician'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }
    next();
};

const staffOnly = [authenticateToken, authorizeStaff];

// ======== ENDPOINT LAB DATA SERVICE  ========

// GET: Mengambil semua hasil lab
app.get('/results', staffOnly, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM LabResults ORDER BY inputAt DESC');
        res.json(result.rows);
    } catch (error) {
        console.error("Error GET /results:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// POST: Menambah hasil lab baru berdasarkan sampleId
app.post('/results', staffOnly, async (req, res) => {
    const { sampleId, parameter, value, unit, testDate, analystName } = req.body;
    
    if (!sampleId) return res.status(400).json({ message: 'ID Sampel wajib diisi.' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Cari requestId yang terhubung dengan sampleId
        const sampleQuery = 'SELECT requestId FROM SampleLogs WHERE sampleId = $1';
        const sampleResult = await client.query(sampleQuery, [sampleId]);

        if (sampleResult.rows.length === 0) {
            throw new Error('ID Sampel tidak ditemukan di log lapangan.');
        }
        const { requestid } = sampleResult.rows[0];

        // 2. Masukkan hasil lab dengan requestId yang sudah ditemukan
        const resultQuery = `
            INSERT INTO LabResults (requestId, sampleId, parameter, value, unit, testDate, analystName) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
        `;
        const result = await client.query(resultQuery, [requestid, sampleId, parameter, value, unit, testDate, analystName]);
        
        // 3. Update status sampel menjadi 'Dianalisis'
        await client.query(`UPDATE SampleLogs SET status = 'Dianalisis' WHERE sampleId = $1`, [sampleId]);

        // --- LANGKAH BARU YANG DITAMBAHKAN ---
        // 4. Update status ServiceRequest utama menjadi 'Dianalisis'
        await client.query(`UPDATE ServiceRequests SET status = 'Dianalisis' WHERE requestId = $1`, [requestid]);

        await client.query('COMMIT');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error POST /results:", error);
        res.status(500).json({ message: error.message || 'Server error' });
    } finally {
        client.release();
    }
});

// --- UPDATE (PUT)  ---
app.put('/results/:id', staffOnly, async (req, res) => {
    const { id } = req.params; // Ambil resultId dari URL
    const { requestId, sampleId, parameter, value, unit, testDate, analystName } = req.body;

    try {
        const query = `
            UPDATE LabResults 
            SET requestId = $1, sampleId = $2, parameter = $3, value = $4, unit = $5, testDate = $6, analystName = $7
            WHERE resultId = $8
            RETURNING *;
        `;
        const result = await pool.query(query, [requestId, sampleId, parameter, value, unit, testDate, analystName, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Hasil lab tidak ditemukan.' });
        }
        res.status(200).json({ message: 'Hasil lab berhasil diperbarui.', result: result.rows[0] });
    } catch (error) {
        console.error(`Error PUT /results/${id}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});

// --- DELETE ---
app.delete('/results/:id', staffOnly, async (req, res) => {
    const { id } = req.params; // Ambil resultId dari URL

    try {
        const result = await pool.query('DELETE FROM LabResults WHERE resultId = $1 RETURNING *;', [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Hasil lab tidak ditemukan.' });
        }
        res.status(200).json({ message: `Hasil lab dengan ID ${id} berhasil dihapus.` });
    } catch (error) {
        console.error(`Error DELETE /results/${id}:`, error);
        res.status(500).json({ message: 'Server error' });
    }
});


app.listen(PORT, () => {
    console.log(`✅ Microservice 'lab-data-service' berjalan di http://localhost:${PORT}`);
});