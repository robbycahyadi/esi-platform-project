import React, { useState, useEffect } from 'react';
import api from '../services/api';

const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const pageLayout = { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };

const AdminManualDataPage = () => {
    const [readings, setReadings] = useState([]);
    const [activeRequests, setActiveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ requestId: '', parameter: '', value: '', unit: '' });

    const fetchData = async () => {
    setLoading(true);
    try {
        const [readingsRes, requestsRes] = await Promise.all([
            api.get('/api/field/manual-data'),
            // Panggil endpoint untuk mendapatkan permintaan aktif
            api.get('/api/service/requests/scheduled') 
        ]);
        setReadings(readingsRes.data);
        setActiveRequests(requestsRes.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
};

    useEffect(() => { fetchData(); }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/api/field/manual-data', formData);
            alert('Data manual berhasil disubmit!');
            fetchData();
            setFormData({ requestId: '', parameter: '', value: '', unit: '' });
        } catch (error) { alert('Gagal submit data.'); }
    };

    if (loading) return <div>Memuat data...</div>;

    return (
        <div>
            <h1>Input Pengukuran Manual</h1>
            <div style={pageLayout}>
                <div style={cardStyle}>
                    <h3>Submit Data Baru</h3>
                    <form onSubmit={handleSubmit}>
                        <label>Untuk Permintaan ID</label>
                        <select name="requestId" value={formData.requestId} onChange={handleInputChange} style={inputStyle} required>
                            <option value="">-- Pilih Permintaan Aktif --</option>
                            {activeRequests.map(r => <option key={r.requestid} value={r.requestid}>{r.requestid.substring(0,8)}... ({r.customer_name})</option>)}
                        </select>
                        <label>Parameter</label>
                        <input type="text" name="parameter" value={formData.parameter} onChange={handleInputChange} style={inputStyle} placeholder="Contoh: Getaran" required />
                        <label>Nilai</label>
                        <input type="number" step="0.01" name="value" value={formData.value} onChange={handleInputChange} style={inputStyle} placeholder="Contoh: 5.2" required />
                        <label>Satuan</label>
                        <input type="text" name="unit" value={formData.unit} onChange={handleInputChange} style={inputStyle} placeholder="Contoh: mm/s" required />
                        <button type="submit" style={{width: '100%', padding: '12px', background: '#007BFF', color: 'white', border: 'none'}}>Submit Data</button>
                    </form>
                </div>
                {/* Tabel Riwayat Diperbarui */}
                <div style={cardStyle}>
                    <h3>Riwayat Input Data Manual</h3>
                    <div style={{maxHeight: '60vh', overflowY: 'auto'}}>
                        <table style={{ width: '100%' }}>
                            <thead>
                                {/* TAMBAHKAN KOLOM BARU: Status Permintaan */}
                                <tr><th>ID Permintaan</th><th>Parameter</th><th>Nilai</th><th>Waktu Input</th><th>Status Permintaan</th></tr>
                            </thead>
                            <tbody>
                                {readings.map(item => (
                                    <tr key={item.readingid}>
                                        <td>{item.requestid.substring(0,8)}...</td>
                                        <td>{item.parameter}</td>
                                        <td>{item.value} {item.unit}</td>
                                        <td>{new Date(item.readingtime).toLocaleString('id-ID')}</td>
                                        {/* Tampilkan status dari data JOIN */}
                                        <td><strong>{item.request_status}</strong></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminManualDataPage;