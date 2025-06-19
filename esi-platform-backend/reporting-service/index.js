// reporting-service/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const PDFDocument = require('pdfkit'); // Import pustaka PDF
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3006; // Berjalan di port 3006
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

app.use(cors());
app.use(express.json());

// --- Middleware (authenticateToken & authorizeAdmin) ---
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
    const allowedRoles = ['admin'];
    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'Akses ditolak.' });
    }
    next();
};

const adminOnly = [authenticateToken, authorizeAdmin];

// ======== REPORTING SERVICE ENDPOINT ========

// POST /generate: Membuat laporan PDF di server
app.post('/generate', adminOnly, async (req, res) => {
    const { requestId } = req.body;
    const adminId = req.user.userId;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // 1. Ambil semua data yang diperlukan untuk laporan
        const requestData = await client.query('SELECT * FROM ServiceRequests WHERE requestId = $1', [requestId]);
        const labResults = await client.query('SELECT * FROM LabResults WHERE requestId = $1', [requestId]);
        // (Di sini Anda juga bisa mengambil data dari ManualReadings, dll.)

        // 2. Buat Dokumen PDF menggunakan PDFKit
        const doc = new PDFDocument({ margin: 50 });
        const reportName = `report-${requestId}.pdf`;
        const reportPath = path.join(__dirname, 'generated-reports', reportName);
        doc.pipe(fs.createWriteStream(reportPath));

        // Isi konten PDF
        doc.fontSize(20).text('Laporan Hasil Pengujian Lingkungan', { align: 'center' });
        doc.fontSize(12).text(`ID Permintaan: ${requestId}`, { align: 'left' });
        doc.moveDown();
        doc.text('Hasil Analisis Laboratorium:');
        labResults.rows.forEach(r => {
            doc.text(`- ${r.parameter}: ${r.value} ${r.unit} (Analis: ${r.analystname})`);
        });
        // ... (tambahkan data lain yang relevan)
        doc.end();

        // 3. Simpan metadata laporan ke database
        const reportQuery = 'INSERT INTO Reports (requestId, generatedBy, fileUrl) VALUES ($1, $2, $3) RETURNING *';
        await client.query(reportQuery, [requestId, adminId, reportName]);

        // 4. Update status ServiceRequest menjadi 'Selesai'
        await client.query(`UPDATE ServiceRequests SET status = 'Selesai' WHERE requestId = $1`, [requestId]);

        await client.query('COMMIT');
        res.status(201).json({ message: 'Laporan berhasil dibuat dan layanan diselesaikan.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saat membuat laporan:', error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    } finally {
        client.release();
    }
});

// GET /request/:requestId: Mengambil info laporan untuk sebuah request
app.get('/request/:requestId', authenticateToken, async(req, res) => {
    const { requestId } = req.params;
    try {
        const result = await pool.query('SELECT reportId, fileUrl FROM Reports WHERE requestId = $1', [requestId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
        }
        res.json(result.rows[0]);
    } catch(e) { res.status(500).json({message: 'Server error'})}
});

// GET /download/:reportId: Menyediakan file PDF untuk diunduh (dengan verifikasi kepemilikan)
app.get('/download/:reportId', authenticateToken, async (req, res) => {
    const { reportId } = req.params;
    const { userId, role } = req.user; // Ambil info pengguna dari token

    try {
        // Query ini melakukan JOIN untuk mendapatkan fileUrl sekaligus userId pemilik request
        const query = `
            SELECT r.fileUrl, sr.userId 
            FROM Reports r
            JOIN ServiceRequests sr ON r.requestId = sr.requestId
            WHERE r.reportId = $1;
        `;
        const result = await pool.query(query, [reportId]);

        if (result.rows.length === 0) {
            return res.status(404).send('File laporan tidak ditemukan.');
        }

        const reportData = result.rows[0];

        // VERIFIKASI KEPEMILIKAN:
        // Cek apakah userId dari token sama dengan userId pemilik laporan, ATAU jika yang login adalah admin.
        if (reportData.userid !== userId && role !== 'admin') {
            return res.status(403).send('Akses ditolak. Anda bukan pemilik laporan ini.');
        }

        // Jika verifikasi berhasil, kirim file
        const reportName = reportData.fileurl;
        const reportPath = path.join(__dirname, 'generated-reports', reportName);
        
        // Kirim file ke browser sebagai attachment untuk diunduh
        res.download(reportPath);

    } catch (error) {
        console.error("Error saat unduh laporan:", error);
        res.status(500).send('Gagal mengunduh laporan.');
    }
});

app.listen(PORT, () => {
    console.log(`✅ Microservice 'reporting-service' berjalan di http://localhost:${PORT}`);
});