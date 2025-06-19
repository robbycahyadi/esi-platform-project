// analytics-service/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = 3007;
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

const adminOnly = [authenticateToken, authorizeAdmin];

// ======== ANALYTICS SERVICE ENDPOINTS ========

// Endpoint untuk grafik tren di Halaman Analitik Pelanggan
app.get('/trends', authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { parameter, startDate, endDate } = req.query;

    if (!parameter || !startDate || !endDate) {
        return res.status(400).json({ message: 'Parameter, startDate, dan endDate diperlukan.' });
    }

    try {
        // Kueri ini sekarang menggabungkan 3 sumber data dengan benar
        const query = `
            WITH all_measurements AS (
                -- Data dari Hasil Lab (terhubung via requestId -> userId)
                SELECT sr.userId, lr.testDate as "timestamp", lr.parameter, lr.value
                FROM LabResults lr
                JOIN ServiceRequests sr ON lr.requestId = sr.requestId
                WHERE lr.parameter = $1 AND lr.testDate BETWEEN $2 AND $3
                
                UNION ALL
                
                -- Data dari Input Manual (terhubung via requestId -> userId)
                SELECT sr.userId, mr.readingTime as "timestamp", mr.parameter, mr.value
                FROM ManualReadings mr
                JOIN ServiceRequests sr ON mr.requestId = sr.requestId
                WHERE mr.parameter = $1 AND mr.readingTime BETWEEN $2 AND $3

                UNION ALL

                -- Data dari Sensor IoT (terhubung via sensorId -> userId)
                SELECT
                    s.userId,
                    sd."timestamp",
                    sd.parameter,
                    sd.value
                FROM SensorData sd
                JOIN Sensors s ON sd.sensorId = s.sensorId -- JOIN ke tabel Sensors
                WHERE s.userId = $4 -- Langsung filter berdasarkan pemilik sensor
                AND sd.parameter = $1 AND sd."timestamp" BETWEEN $2 AND $3
            )
            SELECT
                DATE_TRUNC('day', "timestamp")::DATE as date,
                AVG(value)::NUMERIC(10,2) as value
            FROM all_measurements
            WHERE userId = $4 -- Filter terakhir untuk memastikan semua data milik user yang login
            GROUP BY date
            ORDER BY date ASC;
        `;
        const result = await pool.query(query, [parameter, startDate, endDate, userId]);
        res.json(result.rows);
    } catch (error) {
        console.error("Error GET /trends:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Endpoint untuk widget Perkiraan Beban Kerja di Dashboard Admin
app.get('/workload-forecast', adminOnly, async (req, res) => {
    try {
        const query = `
            SELECT scheduledDate, COUNT(*) as jobs
            FROM Schedules
            WHERE scheduledDate >= CURRENT_DATE AND scheduledDate < CURRENT_DATE + INTERVAL '5 days'
            GROUP BY scheduledDate
            ORDER BY scheduledDate ASC;
        `;
        const result = await pool.query(query);
        const formattedData = result.rows.map(row => ({
            day: new Date(row.scheduleddate).toLocaleDateString('id-ID', { weekday: 'short' }),
            jobs: parseInt(row.jobs, 10)
        }));
        res.json(formattedData);
    } catch (error) {
        console.error("Error GET /workload-forecast:", error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`✅ Microservice 'analytics-service' berjalan di http://localhost:${PORT}`);
});