// iot-simulator.js
const mqtt = require('mqtt');

// const BROKER_URL = 'mqtt://broker.hivemq.com';
// const BROKER_URL = 'ws://broker.hivemq.com:8000/mqtt';
const BROKER_URL = 'mqtt://localhost';
const SENSOR_ID = 'SENS1001-Cikarang';
const TOPIC = `esi/prod/sensor/${SENSOR_ID}/data`;

console.log(`[*] Mencoba terhubung ke MQTT Broker: ${BROKER_URL}`);
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log(`[+] Terhubung! Siap mengirim data ke topik: ${TOPIC}`);
    setInterval(() => {
        const payload = {
            pm25: (Math.random() * 40 + 15).toFixed(2), // Nilai antara 15-55
            co2: (Math.random() * 150 + 400).toFixed(2),  // Nilai antara 400-550
            temperature: (Math.random() * 5 + 27).toFixed(2), // Nilai antara 27-32
            timestamp: new Date().toISOString()
        };
        client.publish(TOPIC, JSON.stringify(payload));
        console.log(`[>] Data terkirim:`, payload);
    }, 50000); // Kirim data setiap 50 detik
});

client.on('error', (err) => {
    console.error('[-] Gagal terhubung:', err);
    client.end();
});