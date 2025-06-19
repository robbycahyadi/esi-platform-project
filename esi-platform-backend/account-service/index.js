// account-service/index.js

// 1. Import Pustaka
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

// 2. Inisialisasi & Konfigurasi
const app = express();
const PORT = 3001; // Layanan akun akan berjalan di port 3001

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

// 3. Definisi Route / Endpoint

// Endpoint untuk Registrasi Pengguna Baru
app.post('/register', async (req, res) => {
    const { name, email, password, organization, role = 'customer' } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Input tidak lengkap.' });

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        const result = await pool.query(
            'INSERT INTO UserProfiles (name, email, password, organization, role) VALUES ($1, $2, $3, $4, $5) RETURNING userId, name, email, role',
            [name, email, hashedPassword, organization, role]
        );
        
        res.status(201).json({ message: 'Akun berhasil dibuat.', user: result.rows[0] });
    } catch (error) {
        if (error.code === '23505') return res.status(409).json({ message: 'Email sudah terdaftar.' });
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Endpoint untuk Login Pengguna
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Input tidak lengkap.' });

    try {
        const userResult = await pool.query('SELECT * FROM UserProfiles WHERE email = $1', [email]);
        if (userResult.rows.length === 0) return res.status(401).json({ message: 'Kredensial salah.' });

        const user = userResult.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Kredensial salah.' });
        
        const token = jwt.sign({ userId: user.userid, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1h' });
        
        res.json({ message: 'Login berhasil!', token, user: { name: user.name, email: user.email, role: user.role } });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// Mengambil semua pengguna bisa filter by role
app.get('/users', [authenticateToken, authorizeAdmin], async (req, res) => {
    const { role } = req.query; // Ambil query parameter 'role'
    
    let query = 'SELECT userId, name, email, role FROM UserProfiles ORDER BY createdAt DESC';
    let queryParams = [];

    if (role) {
        query = 'SELECT userId, name, email, role FROM UserProfiles WHERE role = $1 ORDER BY createdAt DESC';
        queryParams.push(role);
    }

    try {
        const result = await pool.query(query, queryParams);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Gagal mengambil data pengguna.' });
    }
});

// Mengubah data pengguna (termasuk peran)
app.put('/users/:id', [authenticateToken, authorizeAdmin], async (req, res) => {
    const { id } = req.params;
    const { name, organization, role } = req.body;
    try {
        const result = await pool.query(
            'UPDATE UserProfiles SET name = $1, organization = $2, role = $3 WHERE userId = $4 RETURNING *',
            [name, organization, role, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
        res.json({ message: 'Data pengguna berhasil diperbarui.', user: result.rows[0] });
    } catch (error) {
        res.status(500).json({ message: 'Gagal memperbarui data pengguna.' });
    }
});

// Menghapus pengguna
app.delete('/users/:id', [authenticateToken, authorizeAdmin], async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM UserProfiles WHERE userId = $1', [id]);
        res.status(200).json({ message: 'Pengguna berhasil dihapus.' });
    } catch (error) {
        res.status(500).json({ message: 'Gagal menghapus pengguna.' });
    }
});


// 4. Menjalankan Server
app.listen(PORT, () => {
    console.log(`✅ Microservice 'account-service' berjalan di http://localhost:${PORT}`);
});