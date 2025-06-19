import React, { useState, useEffect } from 'react';
import api from '../services/api';

const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px' };
const inputStyle = { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px' };
const formRowStyle = { display: 'flex', gap: '15px', alignItems: 'flex-end', marginBottom: '20px' };

const sampleStatuses = ['Di Lapangan', 'Dalam Perjalanan', 'Diterima Lab', 'Dianalisis', 'Selesai'];

const AdminSampleLogisticsPage = () => {
    const [samples, setSamples] = useState([]);
    const [activeRequests, setActiveRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ requestId: '', sampleId: '', status: 'Di Lapangan' });

    const fetchData = async () => {
    setLoading(true);
    try {
        const [samplesRes, requestsRes] = await Promise.all([
            api.get('/api/field/samples'),
             // Panggil endpoint yang benar dan lebih spesifik
            api.get('/api/service/requests/scheduled')
        ]);
        setSamples(samplesRes.data);
        setActiveRequests(requestsRes.data);
    } catch (error) { console.error(error); } finally { setLoading(false); }
};

    useEffect(() => { fetchData(); }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        if (!formData.requestId || !formData.sampleId) {
            alert('Silakan isi semua field.');
            return;
        }
        try {
            await api.post('/api/field/samples', formData);
            alert('Log sampel baru berhasil ditambahkan!');
            fetchData();
            setFormData({ requestId: '', sampleId: '', status: 'Di Lapangan' });
        } catch (error) { alert('Gagal menambahkan log sampel.'); }
    };

    const handleStatusChange = async (logId, newStatus) => {
        try {
            await api.put(`/api/field/samples/${logId}/status`, { status: newStatus });
            // Cukup refresh data untuk konsistensi
            fetchData();
        } catch (error) {
            alert('Gagal mengubah status.');
            fetchData();
        }
    };

    if (loading) return <div>Memuat data log sampel...</div>;

    return (
        <div>
            <h1>Manajemen Log Sampel</h1>
            <div style={cardStyle}>
                <h3>Log Sampel Baru dari Lapangan</h3>
                <form onSubmit={handleFormSubmit}>
                    <div style={formRowStyle}>
                        <div style={{flex: 2}}><label>Untuk Permintaan ID</label>
                            <select name="requestId" value={formData.requestId} onChange={handleInputChange} style={inputStyle} required>
                                <option value="">-- Pilih Permintaan Aktif --</option>
                                {activeRequests.map(r => <option key={r.requestid} value={r.requestid}>{r.requestid.substring(0,8)}... ({r.customer_name})</option>)}
                            </select>
                        </div>
                        <div style={{flex: 1}}><label>ID Sampel Fisik</label><input name="sampleId" placeholder="Contoh: SMPL-001" value={formData.sampleId} onChange={handleInputChange} style={inputStyle} required /></div>
                        <button type="submit" style={{padding: '10px 20px', height: '44px'}}>Tambah Log</button>
                    </div>
                </form>
            </div>
            <div style={cardStyle}>
                <h3>Riwayat dan Pelacakan Status Sampel</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{textAlign:'left'}}><th>ID Log</th><th>ID Sampel</th><th>ID Permintaan</th><th>Waktu Log</th><th>Status</th></tr></thead>
                    <tbody>
                        {samples.map(sample => (
                            <tr key={sample.logid}>
                                <td style={{padding:'8px'}}>{sample.logid.substring(0,8)}...</td><td>{sample.sampleid}</td><td>{sample.requestid.substring(0,8)}...</td><td>{new Date(sample.logtime).toLocaleString('id-ID')}</td>
                                <td>
                                    <select value={sample.status} onChange={(e) => handleStatusChange(sample.logid, e.target.value)} style={{padding: '5px', border: '1px solid #ccc'}}>
                                        {sampleStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default AdminSampleLogisticsPage;