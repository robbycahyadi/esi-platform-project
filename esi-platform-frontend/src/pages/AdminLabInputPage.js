import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Menggunakan API client terpusat kita

// --- Style Definitions ---
const pageLayout = { display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' };
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '12px', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '16px' };

const AdminLabInputPage = () => {
    // State Management Lengkap
    const initialFormState = { sampleId: '', parameter: '', value: '', unit: '', testDate: '', analystName: '' };
    const [results, setResults] = useState([]);
    const [pendingSamples, setPendingSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(null); // Menyimpan resultId yang diedit

    // Fungsi Pengambilan Data dari Backend
    const fetchData = async () => {
        setLoading(true);
        try {
            const [resultsRes, samplesRes] = await Promise.all([
                api.get('/api/lab/results'),
                api.get('/api/field/samples/pending-lab')
            ]);
            setResults(resultsRes.data);
            setPendingSamples(samplesRes.data);
        } catch (error) { console.error("Gagal memuat data:", error); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Handler untuk Form dan Aksi CRUD ---
    const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleEditClick = (result) => {
        setIsEditing(result.resultid);
        setFormData({
            // Saat edit, kita tidak perlu requestId, cukup data yang ada di form
            sampleId: result.sampleid,
            parameter: result.parameter,
            value: result.value,
            unit: result.unit,
            testDate: new Date(result.testdate).toISOString().split('T')[0],
            analystName: result.analystname,
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(null);
        setFormData(initialFormState);
    };

    const handleDeleteClick = async (resultId) => {
        if (window.confirm(`Anda yakin ingin menghapus hasil lab ini?`)) {
            try {
                await api.delete(`/api/lab/results/${resultId}`);
                alert('Hasil lab berhasil dihapus.');
                fetchData();
            } catch (error) { alert('Gagal menghapus hasil lab.'); }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                // Saat mengedit, kita perlu menyertakan requestId yang sudah ada di hasil lab tersebut
                const originalResult = results.find(r => r.resultid === isEditing);
                await api.put(`/api/lab/results/${isEditing}`, { ...formData, requestId: originalResult.requestid });
                alert('Hasil lab berhasil diperbarui.');
            } else {
                if (!formData.sampleId) {
                    alert('Silakan pilih ID Sampel terlebih dahulu.');
                    return;
                }
                await api.post('/api/lab/results', formData);
                alert('Hasil lab baru berhasil disubmit.');
            }
            fetchData();
            handleCancelEdit();
        } catch (error) {
            alert('Gagal menyimpan data: ' + (error.response?.data?.message || 'Server error'));
        }
    };

    if (loading) return <div>Memuat data...</div>;

    return (
        <div>
            <h1>Manajemen Data Laboratorium</h1>
            <div style={pageLayout}>
                {/* Kolom Kiri: Form Input/Edit */}
                <div style={cardStyle}>
                    <h3>{isEditing ? 'Edit Hasil Analisis' : 'Input Hasil Baru'}</h3>
                    <form onSubmit={handleSubmit}>
                        <label>Pilih ID Sampel (Diterima Lab)</label>
                        {/* Dropdown hanya aktif saat mode 'Create' */}
                        <select name="sampleId" value={formData.sampleId} onChange={handleInputChange} style={inputStyle} required disabled={isEditing}>
                            <option value="">{isEditing ? formData.sampleId : '-- Pilih Sampel --'}</option>
                            {!isEditing && pendingSamples.map(s => <option key={s.logid} value={s.sampleid}>{s.sampleid}</option>)}
                        </select>
                        {/* ... sisa form input sama persis ... */}
                        <label>Tanggal Tes</label><input type="date" name="testDate" value={formData.testDate} onChange={handleInputChange} style={inputStyle} required />
                        <label>Nama Analis</label><input type="text" name="analystName" value={formData.analystName} onChange={handleInputChange} style={inputStyle} required />
                        <label>Parameter Uji</label><input type="text" name="parameter" value={formData.parameter} onChange={handleInputChange} style={inputStyle} required />
                        <label>Nilai Hasil</label><input type="number" step="0.01" name="value" value={formData.value} onChange={handleInputChange} style={inputStyle} required />
                        <label>Satuan</label><input type="text" name="unit" value={formData.unit} onChange={handleInputChange} style={inputStyle} required />
                        <button type="submit" style={{ ...buttonStyle, background: isEditing ? '#ffc107' : '#28a745' }}>{isEditing ? 'Simpan Perubahan' : 'Submit Hasil'}</button>
                        {isEditing && (<button type="button" onClick={handleCancelEdit} style={{ ...buttonStyle, background: '#6c757d', marginTop: '10px' }}>Batal Edit</button>)}
                    </form>
                </div>
                {/* Kolom Kanan: Daftar Hasil */}
                <div style={cardStyle}>
                    <h3>Riwayat Input Hasil Lab</h3>
                    <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                        <table style={{ width: '100%' }}>
                            <thead><tr><th>ID Sampel</th><th>Parameter</th><th>Nilai</th><th>Analis</th><th>Aksi</th></tr></thead>
                            <tbody>
                                {results.map(res => (
                                    <tr key={res.resultid}>
                                        <td>{res.sampleid}</td><td>{res.parameter}</td><td>{res.value} {res.unit}</td><td>{res.analystname}</td>
                                        <td>
                                            <button onClick={() => handleEditClick(res)}>Edit</button>
                                            <button onClick={() => handleDeleteClick(res.resultid)} style={{ marginLeft: '5px' }}>Hapus</button>
                                        </td>
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
export default AdminLabInputPage;