const mqtt = require('mqtt');

// Konfigurasi MQTT Broker
// Gunakan broker publik untuk kemudahan testing, atau instal Mosquitto/EMQX secara lokal.
const BROKER_URL = 'mqtt://broker.hivemq.com';
const SENSOR_ID = 'SENS1001'; // ID Sensor Dummy
const TOPIC = `iot/esi/sensor/${SENSOR_ID}/data`; // Topik sesuai Deliverable 3

// Fungsi untuk menghasilkan nilai data acak dalam rentang realistis
const getRandomValue = (min, max) => {
    return (Math.random() * (max - min) + min).toFixed(2);
};

// Fungsi untuk membuat payload data sensor
// Struktur payload sesuai dengan yang didefinisikan di Deliverable 3 [cite: 19]
const generateDummyData = () => {
    return {
        sensor_id: SENSOR_ID,
        timestamp: new Date().toISOString(),
        data: {
            pm25: parseFloat(getRandomValue(30, 60)), // PM 2.5 antara 30-60 µg/m³
            co2: parseInt(getRandomValue(400, 550)), // CO2 antara 400-550 ppm
            temperature: parseFloat(getRandomValue(27, 32)), // Suhu antara 27-32 °C
            humidity: parseFloat(getRandomValue(60, 85)) // Kelembaban antara 60-85%
        }
    };
};

// Koneksi ke MQTT Broker
const client = mqtt.connect(BROKER_URL);

client.on('connect', () => {
    console.log(`[+] Terhubung ke MQTT Broker: ${BROKER_URL}`);
    console.log(`[*] Simulator akan mulai mengirim data untuk sensor ID: ${SENSOR_ID}`);
    console.log(`[*] Topik: ${TOPIC}`);

    // Mengirim data setiap 5 detik
    setInterval(() => {
        const payload = generateDummyData();
        const payloadString = JSON.stringify(payload);

        client.publish(TOPIC, payloadString, (err) => {
            if (err) {
                console.error('[-] Gagal mengirim data:', err);
            } else {
                console.log(`[>] Data terkirim: ${payloadString}`);
            }
        });
    }, 5000);
});

client.on('error', (err) => {
    console.error('[-] Gagal terhubung ke MQTT Broker:', err);
    client.end();
});