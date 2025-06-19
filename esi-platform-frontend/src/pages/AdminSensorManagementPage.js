import React, { useState, useEffect } from 'react';
import api from '../services/api';

const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '30px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };
const buttonStyle = { padding: '10px 20px', border: 'none', borderRadius: '4px', color: 'white', cursor: 'pointer', fontSize: '14px' };

const AdminSensorManagementPage = () => {
    const [sensors, setSensors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingSensor, setEditingSensor] = useState(null);
    const [formData, setFormData] = useState({ serialNumber: '', type: 'Udara Ambien', location: '', installDate: '', status: 'Online' });

    const fetchSensors = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/field/sensors');
            setSensors(response.data);
        } catch (error) {
            console.error("Gagal memuat data sensor:", error);
            alert('Gagal memuat data sensor.');
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchSensors(); }, []);

    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const handleAddNewClick = () => {
        setEditingSensor(null);
        setFormData({ serialNumber: '', type: 'Udara Ambien', location: '', installDate: '', status: 'Online' });
        setIsFormVisible(true);
    };
    const handleEditClick = (sensor) => {
        setEditingSensor(sensor);
        setFormData({
            serialNumber: sensor.serialnumber,
            type: sensor.type,
            location: sensor.location,
            installDate: new Date(sensor.installdate).toISOString().split('T')[0],
            status: sensor.status
        });
        setIsFormVisible(true);
    };
    const handleCancel = () => setIsFormVisible(false);
    const handleDelete = async (sensorId) => {
        if (window.confirm(`Yakin ingin menghapus sensor ${sensorId}?`)) {
            try {
                await api.delete(`/api/field/sensors/${sensorId}`);
                alert('Sensor berhasil dihapus.');
                fetchSensors();
            } catch (error) { alert('Gagal menghapus sensor.'); }
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingSensor) {
                await api.put(`/api/field/sensors/${editingSensor.sensorid}`, formData);
                alert('Data sensor berhasil diperbarui.');
            } else {
                await api.post('/api/field/sensors', formData);
                alert('Sensor baru berhasil didaftarkan.');
            }
            fetchSensors();
            handleCancel();
        } catch (error) { alert('Gagal menyimpan data sensor.'); }
    };

    if (loading) return <div>Memuat data sensor...</div>;

    return (
        <div>
            <h1>Manajemen Sensor IoT</h1>
            {!isFormVisible && <button onClick={handleAddNewClick} style={{ ...buttonStyle, background: '#007BFF', marginBottom: '20px' }}>+ Daftarkan Sensor Baru</button>}
            
            {isFormVisible && (
                <div style={cardStyle}>
                    <h3>{editingSensor ? 'Edit Data Sensor' : 'Form Pendaftaran Sensor Baru'}</h3>
                    <form onSubmit={handleSubmit}>
                        <label>Nomor Seri</label><input name="serialNumber" style={inputStyle} value={formData.serialNumber} onChange={handleInputChange} required />
                        <label>Tipe Sensor</label><select name="type" style={inputStyle} value={formData.type} onChange={handleInputChange}><option value="Udara Ambien">Udara Ambien</option><option value="Emisi Cerobong">Emisi Cerobong</option><option value="Kebisingan">Kebisingan</option></select>
                        <label>Lokasi Pemasangan</label><input name="location" style={inputStyle} value={formData.location} onChange={handleInputChange} required />
                        <label>Tanggal Pemasangan</label><input name="installDate" type="date" style={inputStyle} value={formData.installDate} onChange={handleInputChange} required />
                        {editingSensor && (<><label>Status</label><select name="status" style={inputStyle} value={formData.status} onChange={handleInputChange}><option value="Online">Online</option><option value="Offline">Offline</option><option value="Maintenance">Maintenance</option></select></>)}
                        <button type="submit" style={{ ...buttonStyle, background: '#28a745' }}>{editingSensor ? 'Simpan Perubahan' : 'Daftarkan'}</button>
                        <button type="button" onClick={handleCancel} style={{ ...buttonStyle, background: '#6c757d', marginLeft: '10px' }}>Batal</button>
                    </form>
                </div>
            )}
            <div style={cardStyle}>
                <h3>Daftar Sensor Terpasang</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr style={{textAlign: 'left'}}><th>ID Sensor</th><th>Nomor Seri</th><th>Tipe</th><th>Lokasi</th><th>Status</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {sensors.map(sensor => (
                            <tr key={sensor.sensorid}>
                                <td style={{padding: '10px'}}>{sensor.sensorid.substring(0,8)}...</td><td>{sensor.serialnumber}</td><td>{sensor.type}</td><td>{sensor.location}</td>
                                <td><span style={{ color: sensor.status === 'Online' ? 'green' : 'red', fontWeight: 'bold' }}>{sensor.status}</span></td>
                                <td>
                                    <button onClick={() => handleEditClick(sensor)} style={{ ...buttonStyle, background: '#ffc107', color: 'black' }}>Edit</button>
                                    <button onClick={() => handleDelete(sensor.sensorid)} style={{ ...buttonStyle, background: '#dc3545', marginLeft: '5px' }}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default AdminSensorManagementPage;