import React, { useState } from 'react';
import api from '../services/api';

const formContainerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f4f7f6'
};

const formStyle = {
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    backgroundColor: 'white',
    width: '350px'
};

const inputStyle = {
    width: '100%',
    padding: '10px',
    marginBottom: '15px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    boxSizing: 'border-box'
};

const buttonStyle = {
    width: '100%',
    padding: '10px',
    border: 'none',
    borderRadius: '4px',
    backgroundColor: '#007BFF',
    color: 'white',
    cursor: 'pointer',
    fontSize: '16px'
};

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [userType, setUserType] = useState('customer');
    const [error, setError] = useState('');

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

        console.log('Mengirim data login:', { email, password });

        // Tentukan target login berdasarkan userType
        if (userType === 'customer') {
            try {
                const response = await api.post('http://localhost:5000/api/account/login', {
                    email,
                    password
                });
                
                const { token, user } = response.data;
                localStorage.setItem('authToken', token);
                localStorage.setItem('userRole', user.role);
                window.location.href = '/'; // Arahkan ke dashboard pelanggan

            } catch (err) {
                const message = err.response ? err.response.data.message : 'Tidak dapat terhubung ke server.';
                setError(message);
            }
        } else {
            // Logika login untuk Staf Internal
            try {
                 const response = await api.post('http://localhost:5000/api/account/login', {
                    email,
                    password
                });

                const { token, user } = response.data;
                // Pastikan role-nya adalah admin atau technician
                if (user.role === 'admin' || user.role === 'technician') {
                    localStorage.setItem('authToken', token);
                    localStorage.setItem('userRole', user.role);
                    window.location.href = '/admin/dashboard'; // Arahkan ke dashboard admin
                } else {
                    setError('Akses ditolak. Akun ini bukan akun staf internal.');
                }
            } catch (err) {
                const message = err.response ? err.response.data.message : 'Tidak dapat terhubung ke server.';
                setError(message);
            }
        }
        
    };

    return (
        <div style={formContainerStyle}>
            <form onSubmit={handleSubmit} style={formStyle}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Login ESI Platform</h2>
                {error && <p style={{ color: 'red' }}>{error}</p>}
                {/* --- TAMBAHKAN PILIHAN TIPE PENGGUNA --- */}
                <div style={{ marginBottom: '15px' }}>
                    <label>Login sebagai:</label>
                    <div>
                        <input type="radio" id="customer" name="userType" value="customer" checked={userType === 'customer'} onChange={(e) => setUserType(e.target.value)} />
                        <label htmlFor="customer" style={{ marginRight: '15px' }}> Pelanggan</label>
                        <input type="radio" id="staff" name="userType" value="staff" checked={userType === 'staff'} onChange={(e) => setUserType(e.target.value)} />
                        <label htmlFor="staff"> Staf Internal</label>
                    </div>
                </div>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        style={inputStyle}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        style={inputStyle}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" style={buttonStyle}>Login</button>
            </form>
        </div>
    );
};

export default LoginPage;