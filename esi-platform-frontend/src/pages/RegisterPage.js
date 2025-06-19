import React, { useState } from 'react';
import api from '../services/api';

// (Gunakan style yang sama dengan LoginPage)
const formContainerStyle = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f4f7f6' };
const formStyle = { padding: '40px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', backgroundColor: 'white', width: '350px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };
const buttonStyle = { width: '100%', padding: '10px', border: 'none', borderRadius: '4px', backgroundColor: '#28a745', color: 'white', cursor: 'pointer', fontSize: '16px' };


const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        organization: ''
    });
    // State untuk menampilkan pesan sukses atau error dari backend
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    // fungsi handleSubmit async untuk menangani API call
    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setError('');

        try {
            // Kirim data form ke endpoint registrasi di backend
            const response = await api.post('http://localhost:5000/api/account/register', formData);

            // Tampilkan pesan sukses dari server
            setMessage(response.data.message + " Silakan login.");
            setFormData({ name: '', email: '', password: '', organization: '' }); // Kosongkan form

        } catch (err) {
            // Tangani error dari server (misalnya, email sudah terdaftar)
            if (err.response && err.response.data) {
                setError(err.response.data.message);
            } else {
                setError('Terjadi kesalahan saat mencoba terhubung ke server.');
            }
        }
    };

    return (
        <div style={formContainerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Registrasi Akun Baru</h2>
                {message && <p style={{ color: 'green' }}>{message}</p>}
                {error && <p style={{ color: 'red' }}>{error}</p>}
                
                {/* Form input tidak berubah */}
                <div>
                    <label htmlFor="name">Nama Lengkap</label>
                    <input type="text" id="name" style={inputStyle} value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" style={inputStyle} value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input type="password" id="password" style={inputStyle} value={formData.password} onChange={handleChange} required />
                </div>
                <div>
                    <label htmlFor="organization">Nama Perusahaan</label>
                    <input type="text" id="organization" style={inputStyle} value={formData.organization} onChange={handleChange} required />
                </div>
                <button type="submit" style={buttonStyle}>Register</button>
            </form>
        </div>
    );
};

export default RegisterPage;