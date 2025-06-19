import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const headerStyle = {
    backgroundColor: '#fff',
    padding: '0 40px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
};

const navStyle = {
    display: 'flex',
    gap: '20px'
};

const navLinkStyle = {
    textDecoration: 'none',
    color: '#333',
    padding: '20px 0',
    fontWeight: 'bold'
};

const logoutButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#007BFF',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '16px'
};

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('authToken'); // Hapus token dari penyimpanan
        navigate('/login'); // Arahkan ke halaman login
    };

    return (
        <header style={headerStyle}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                <Link to="/" style={{ textDecoration: 'none', color: '#000' }}>ESI Platform</Link>
            </div>
            <nav style={navStyle}>
                <Link to="/" style={navLinkStyle}>Dashboard</Link>
                <Link to="/analytics" style={navLinkStyle}>Analitik</Link>
                <Link to="/my-account" style={navLinkStyle}>Akun Saya</Link>
                <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
            </nav>
        </header>
    );
};

export default Header;