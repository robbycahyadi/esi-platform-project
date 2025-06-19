// api-gateway/index.js

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const proxy = require('express-http-proxy'); // <-- Gunakan pustaka baru

const app = express();
const PORT = 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// --- Definisi Rute ke Microservice ---
// Logika ini tetap sama, kita hanya akan menggunakannya secara berbeda
const accountServiceProxy = proxy('http://localhost:3001');
const requestServiceProxy = proxy('http://localhost:3002');
const scheduleServiceProxy = proxy('http://localhost:3003');
const labDataServiceProxy = proxy('http://localhost:3004');
const fieldOperationServiceProxy = proxy('http://localhost:3005');
const ReportingServiceProxy = proxy('http://localhost:3006');
const AnalyticsServiceProxy = proxy('http://localhost:3007');

// --- Atur Routing ---

// Rute untuk Layanan Akun
// Semua request yang masuk ke /api/account/... akan diteruskan ke account-service
app.use('/api/account', (req, res, next) => {
    console.log(`[GATEWAY] Menerima request ke /api/account: ${req.method} ${req.originalUrl}`);
    accountServiceProxy(req, res, next);
});

// Rute untuk Layanan Permintaan
// Semua request yang masuk ke /api/service/... akan diteruskan ke request-service
app.use('/api/service', (req, res, next) => {
    console.log(`[GATEWAY] Menerima request ke /api/service: ${req.method} ${req.originalUrl}`);
    requestServiceProxy(req, res, next);
});

// Rute untuk Layanan Penjadwalan
// Semua request yang masuk ke /api/schedule/... akan diteruskan ke schedule-service
app.use('/api/schedule', (req, res, next) => {
    console.log(`[GATEWAY] Menerima request ke /api/schedule: ${req.method} ${req.originalUrl}`);
    scheduleServiceProxy(req, res, next);
});

// Rute untuk Layanan Lab
// Semua request yang masuk ke /api/lab/... akan diteruskan ke lab-data-service
app.use('/api/lab', (req, res, next) => {
    console.log(`[GATEWAY] Menerima request ke /api/lab: ${req.method} ${req.originalUrl}`);
    labDataServiceProxy(req, res, next);
});

// Rute untuk Layanan Field Operation
// Semua request yang masuk ke /api/field/... akan diteruskan ke field-operation-service
app.use('/api/field', (req, res, next) => {
    console.log(`[GATEWAY] Menerima request ke /api/field: ${req.method} ${req.originalUrl}`);
    fieldOperationServiceProxy(req, res, next);
});

// Rute untuk Layanan Report
// Semua request yang masuk ke /api/report/... akan diteruskan ke reporting-service
app.use('/api/report', (req, res, next) => {
    console.log(`[GATEWAY] Menerima request ke /api/report: ${req.method} ${req.originalUrl}`);
    ReportingServiceProxy(req, res, next);
});

// Rute untuk Layanan Analitik
// Semua request yang masuk ke /api/analytics/... akan diteruskan ke analytics-service
app.use('/api/analytics', (req, res, next) => {
    console.log(`[GATEWAY] Menerima request ke /api/report: ${req.method} ${req.originalUrl}`);
    AnalyticsServiceProxy(req, res, next);
});

app.listen(PORT, () => {
    console.log(` GATEWAY (dengan proxy baru) berjalan di http://localhost:${PORT}`);
});