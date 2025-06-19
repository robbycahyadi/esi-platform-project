import React, { useState } from 'react';

// --- Style Definitions ---
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px' };
const tabContainerStyle = { display: 'flex', borderBottom: '1px solid #ddd', marginBottom: '20px' };
const tabButtonStyle = { padding: '15px 25px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', borderBottom: '3px solid transparent' };
const activeTabStyle = { borderBottom: '3px solid #007BFF', fontWeight: 'bold' };

const FieldOperationsPage = () => {
    const [activeTab, setActiveTab] = useState('sensors'); // 'sensors', 'samples', 'manual'

    return (
        <div>
            <h1>Pusat Operasi Lapangan</h1>
            <div style={cardStyle}>
                <div style={tabContainerStyle}>
                    <button onClick={() => setActiveTab('sensors')} style={{ ...tabButtonStyle, ...(activeTab === 'sensors' && activeTabStyle) }}>Manajemen Sensor</button>
                    <button onClick={() => setActiveTab('samples')} style={{ ...tabButtonStyle, ...(activeTab === 'samples' && activeTabStyle) }}>Log Sampel</button>
                    <button onClick={() => setActiveTab('manual')} style={{ ...tabButtonStyle, ...(activeTab === 'manual' && activeTabStyle) }}>Input Manual</button>
                </div>
                
                {/* Konten Tab akan berubah berdasarkan activeTab */}
                {activeTab === 'sensors' && <SensorManagement />}
                {activeTab === 'samples' && <SampleLogging />}
                {activeTab === 'manual' && <ManualDataInput />}
            </div>
        </div>
    );
};

// --- Komponen untuk Setiap Tab ---

const SensorManagement = () => (
    <div>
        <h3>Manajemen Sensor IoT</h3>
        <p>Daftarkan sensor baru atau kelola sensor yang sudah terpasang.</p>
        <button style={{marginBottom: '15px'}}>+ Daftarkan Sensor Baru</button>
        <table style={{width: '100%'}}>
            <thead><tr><th>ID Sensor</th><th>Lokasi</th><th>Tipe</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
                <tr><td>SENS1001</td><td>PT. Energi Prima</td><td>Udara Ambien</td><td style={{color: 'green'}}>Online</td><td><button>Detail</button></td></tr>
                <tr><td>SENS1002</td><td>PT. Manufaktur Jaya</td><td>Emisi Cerobong</td><td style={{color: 'red'}}>Offline</td><td><button>Detail</button></td></tr>
            </tbody>
        </table>
    </div>
);

const SampleLogging = () => (
    <div>
        <h3>Log Sampel Lapangan</h3>
        <p>Catat sampel fisik yang diambil dari lokasi untuk dilanjutkan ke lab.</p>
         <form>
            <input placeholder="ID Permintaan Layanan (REQ...)" style={{padding: '10px', marginRight: '10px'}}/>
            <input placeholder="ID Sampel Baru (SMPL...)" style={{padding: '10px', marginRight: '10px'}}/>
            <button type="submit">Log Sampel</button>
        </form>
    </div>
);

const ManualDataInput = () => (
    <div>
        <h3>Input Pengukuran Manual</h3>
        <p>Masukkan data dari perangkat ukur non-IoT.</p>
        <form>
            <input placeholder="ID Permintaan Layanan (REQ...)" style={{padding: '10px', marginRight: '10px'}}/>
            <select style={{padding: '10px', marginRight: '10px'}}><option>Pilih Parameter</option><option>PM 2.5</option></select>
            <input placeholder="Nilai" type="number" style={{padding: '10px', marginRight: '10px'}}/>
            <button type="submit">Submit Data</button>
        </form>
    </div>
);

export default FieldOperationsPage;