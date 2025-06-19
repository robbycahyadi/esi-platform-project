import React, { useState, useContext } from 'react'; // 
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ServiceContext } from '../context/ServiceContext';

// (Gunakan style yang sama dengan halaman login untuk konsistensi)
const pageContainerStyle = { padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh' };
const formStyle = { padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', backgroundColor: 'white', maxWidth: '600px', margin: '0 auto' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };
const selectStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', backgroundColor: '#007BFF', color: 'white', cursor: 'pointer', fontSize: '16px' };


const ServiceRequestPage = () => {
    const [formData, setFormData] = useState({
        location: '',
        request_type: 'Uji Emisi Cerobong', // Nilai default
        preferred_date: ''
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Ambil fungsi 'addService' dari Context
    const { addService } = useContext(ServiceContext);
    const { refreshServices } = useContext(ServiceContext);
    const navigate = useNavigate(); // Hook untuk mengarahkan pengguna

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };
    
    const handleSelectChange = (e) => {
        setFormData({ ...formData, request_type: e.target.value });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        const requestPayload = {
            details: {
                location: formData.location,
                request_type: formData.request_type,
                preferred_date: formData.preferred_date
            }
        };
        
        try {
            // --- API CALL ---
            const response = await api.post('http://localhost:5000/api/service/request', requestPayload);
            
            setMessage(response.data.message + " Mengarahkan kembali ke Dashboard...");
            
            // Panggil fungsi untuk mengambil ulang data layanan di context
            refreshServices();

            setTimeout(() => {
                navigate('/');
            }, 2000);

        } catch (err) {
            const message = err.response ? err.response.data.message : 'Gagal mengajukan permintaan.';
            setError(message);
        }
    };

    return (
        <div style={pageContainerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Formulir Permintaan Layanan Baru</h2>
                {message && <p style={{ padding: '10px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb', borderRadius: '4px' }}>{message}</p>}
                
                <div>
                    <label htmlFor="request_type">Jenis Layanan</label>
                    <select id="request_type" style={selectStyle} value={formData.request_type} onChange={handleSelectChange}>
                        <option value="Uji Emisi Cerobong">Uji Emisi Cerobong</option>
                        <option value="Uji Kualitas Udara Ambien">Uji Kualitas Udara Ambien</option>
                        <option value="Pemantauan IoT Real-time">Pemantauan IoT Real-time</option>
                        <option value="Uji Kebisingan Lingkungan">Uji Kebisingan Lingkungan</option>
                    </select>
                </div>

                <div>
                    <label htmlFor="location">Lokasi Pengujian (Contoh: Pabrik Cikarang)</label>
                    <input type="text" id="location" style={inputStyle} value={formData.location} onChange={handleChange} required />
                </div>
                
                <div>
                    <label htmlFor="preferred_date">Tanggal yang Diinginkan</label>
                    <input type="date" id="preferred_date" style={inputStyle} value={formData.preferred_date} onChange={handleChange} required />
                </div>
                
                <button type="submit" style={buttonStyle}>Ajukan Permintaan</button>
            </form>
        </div>
    );
};

export default ServiceRequestPage;