// iot-ingestion-service/index.js
require('dotenv').config();
const mqtt = require('mqtt');
const { Pool } = require('pg');

// const BROKER_URL = 'mqtt://broker.hivemq.com';
const BROKER_URL = 'mqtt://localhost';
const TOPIC_TO_SUBSCRIBE = 'esi/prod/sensor/#'; // Tanda '#' adalah wildcard, mendengarkan semua sensor

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

console.log(`[*] Mencoba terhubung ke MQTT Broker: ${BROKER_URL}`);
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log(`[+] Terhubung! Mendengarkan data di topik: ${TOPIC_TO_SUBSCRIBE}`);
    client.subscribe(TOPIC_TO_SUBSCRIBE, (err) => {
        if (err) console.error("Gagal subscribe:", err);
    });
});

// Ini adalah fungsi utama: apa yang harus dilakukan saat ada pesan masuk
client.on('message', async (topic, message) => {
    try {
        const payload = JSON.parse(message.toString());
        console.log(`[<] Data diterima dari topik ${topic}:`, payload);

        // Ekstrak sensorId dari topik. Contoh: esi/prod/sensor/SENS1001-Cikarang/data
        const topicParts = topic.split('/');
        const sensorIdString = topicParts[3]; 

        // Cari sensorId (UUID) dari database berdasarkan serialNumber (misal: SENS1001-Cikarang)
        const sensorRes = await pool.query('SELECT sensorId FROM Sensors WHERE serialNumber = $1', [sensorIdString]);
        if (sensorRes.rows.length === 0) {
            console.warn(`[!] Peringatan: Menerima data dari sensor yang tidak terdaftar: ${sensorIdString}`);
            return;
        }
        const sensorId = sensorRes.rows[0].sensorid;

        // Simpan ke tabel SensorData
        await pool.query(
            'INSERT INTO SensorData (sensorId, parameter, value, "timestamp") VALUES ($1, $2, $3, $4)',
            [sensorId, 'PM 2.5', payload.pm25, payload.timestamp]
        );
         await pool.query(
            'INSERT INTO SensorData (sensorId, parameter, value, "timestamp") VALUES ($1, $2, $3, $4)',
            [sensorId, 'CO2', payload.co2, payload.timestamp]
        );
        console.log(`[DB] Data dari sensor ${sensorIdString} berhasil disimpan.`);

    } catch (error) {
        console.error('[!] Error memproses pesan:', error);
    }
});

client.on('error', (err) => console.error('[-] Gagal terhubung:', err));