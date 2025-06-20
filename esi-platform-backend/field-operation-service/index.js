// field-operations-service/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = 3005;
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

const authorizeStaff = (req, res, next) => {
    const allowedRoles = ['admin', 'technician'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }
    next();
};

const staffOnly = [authenticateToken, authorizeStaff];

// ======== SENSOR MANAGEMENT ENDPOINTS ========
app.get('/sensors', staffOnly, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM Sensors ORDER BY installDate DESC');
        res.json(result.rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/sensors', staffOnly, async (req, res) => {
    const { serialNumber, type, location, installDate } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO Sensors (serialNumber, type, location, installDate, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [serialNumber, type, location, installDate, 'Online']
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.put('/sensors/:id', staffOnly, async (req, res) => {
    const { id } = req.params;
    const { serialNumber, type, location, installDate, status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE Sensors SET serialNumber = $1, type = $2, location = $3, installDate = $4, status = $5 WHERE sensorId = $6 RETURNING *',
            [serialNumber, type, location, installDate, status, id]
        );
        res.json(result.rows[0]);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.delete('/sensors/:id', staffOnly, async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM Sensors WHERE sensorId = $1', [id]);
        res.status(200).json({ message: 'Sensor berhasil dihapus.' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ======== SAMPLE LOGISTICS ENDPOINTS ========
app.get('/samples', staffOnly, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM SampleLogs ORDER BY logTime DESC');
        res.json(result.rows);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.post('/samples', staffOnly, async (req, res) => {
    const { requestId, sampleId, status } = req.body;
    const { userId } = req.user;
    try {
        const result = await pool.query(
            'INSERT INTO SampleLogs (requestId, sampleId, technicianId, status) VALUES ($1, $2, $3, $4) RETURNING *',
            [requestId, sampleId, userId, status]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) { res.status(500).json({ message: e.message }); }
});

app.get('/samples/pending-lab', staffOnly, async (req, res) => {
    try {
        // Query ini secara spesifik hanya mencari sampel yang siap diuji
        const query = "SELECT logid, sampleid, requestid FROM SampleLogs WHERE status = 'Diterima Lab'";
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error("Error GET /samples/pending-lab:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// PUT: Mengubah status sebuah sampel log DAN mengupdate ServiceRequest jika perlu
app.put('/samples/:logId/status', staffOnly, async (req, res) => {
    const { logId } = req.params;
    const { status: newStatus } = req.body;

    if (!newStatus) {
        return res.status(400).json({ message: 'Status wajib diisi.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Langkah 1: Update status di tabel SampleLogs dan ambil requestId-nya
        const updateSampleQuery = `
            UPDATE SampleLogs SET status = $1 WHERE logId = $2 RETURNING requestId;
        `;
        const sampleResult = await client.query(updateSampleQuery, [newStatus, logId]);

        if (sampleResult.rows.length === 0) {
            throw new Error('Log sampel tidak ditemukan.');
        }

        const { requestid } = sampleResult.rows[0];

        // Langkah 2: Jika status baru adalah 'Dianalisis' atau 'Selesai', update juga ServiceRequest utama
        // Ini adalah logika bisnis yang menghubungkan keduanya.
        if (newStatus === 'Dianalisis' || newStatus === 'Selesai') {
            let newRequestStatus = newStatus === 'Selesai' ? 'Data Processing' : 'Dianalisis';

            const updateRequestQuery = `
                UPDATE ServiceRequests SET status = $1 WHERE requestId = $2;
            `;
            await client.query(updateRequestQuery, [newRequestStatus, requestid]);
            console.log(`[FIELD-OPS] Status untuk ServiceRequest ${requestid} diubah menjadi ${newRequestStatus}`);
        }
        
        await client.query('COMMIT');
        res.status(200).json({ message: `Status log ${logId} berhasil diubah menjadi ${newStatus}` });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(`Error PUT /samples/${logId}/status:`, error);
        res.status(500).json({ message: error.message || 'Server error' });
    } finally {
        client.release();
    }
});

// ======== MANUAL DATA INPUT ENDPOINTS ========
app.get('/manual-data', staffOnly, async (req, res) => {
    try {
        // Lakukan JOIN dengan tabel ServiceRequests untuk mendapatkan status terbarunya
        const query = `
            SELECT mr.*, sr.status as request_status
            FROM ManualReadings mr
            JOIN ServiceRequests sr ON mr.requestId = sr.requestId
            ORDER BY mr.readingTime DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (e) {
        console.error("Error GET /manual-data:", e);
        res.status(500).json({ message: e.message });
    }
});

app.post('/manual-data', staffOnly, async (req, res) => {
    const { requestId, parameter, value, unit } = req.body;
    const { userId } = req.user;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Masukkan data pengukuran manual baru
        const readingQuery = `
            INSERT INTO ManualReadings (requestId, technicianId, parameter, value, unit) 
            VALUES ($1, $2, $3, $4, $5) RETURNING *
        `;
        await client.query(readingQuery, [requestId, userId, parameter, value, unit]);
        
        // 2. Update status ServiceRequest terkait menjadi 'Data Processing'
        const updateRequestQuery = `
            UPDATE ServiceRequests SET status = 'Data Processing' WHERE requestId = $1;
        `;
        await client.query(updateRequestQuery, [requestId]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Data manual berhasil disubmit dan status permintaan diperbarui.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error POST /manual-data:", error);
        res.status(500).json({ message: 'Gagal memproses data manual.' });
    } finally {
        client.release();
    }
});


app.listen(PORT, () => {
    console.log(`✅ Microservice 'field-operations-service' berjalan di http://localhost:${PORT}`);
});