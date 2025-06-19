import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const layoutStyle = { display: 'flex' };
const sidebarStyle = { width: '250px', background: '#2c3e50', color: 'white', minHeight: '100vh', padding: '20px' };
const contentStyle = { flex: 1, padding: '40px', background: '#f4f7f6' };
const navLinkStyle = { display: 'block', color: 'white', textDecoration: 'none', padding: '15px', borderRadius: '4px', marginBottom: '5px' };
const logoutButtonStyle = { background: '#e74c3c', color: 'white', border: 'none', padding: '10px', width: '100%', borderRadius: '4px', cursor: 'pointer', marginTop: '30px' };


const AdminLayout = ({ children }) => {
    const navigate = useNavigate();
    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userRole');
        navigate('/login');
    };

    return (
        <div style={layoutStyle}>
            <aside style={sidebarStyle}>
                <h2 style={{ textAlign: 'center' }}>Admin Portal</h2>
                <nav>
                    <Link to="/admin/dashboard" style={navLinkStyle}>Dashboard</Link>
                    <Link to="/admin/scheduling" style={navLinkStyle}>Manajemen Jadwal</Link>
                    <Link to="/admin/lab-input" style={navLinkStyle}>Input Hasil Lab</Link>
                    <Link to="/admin/user-management" style={navLinkStyle}>Manajemen Pengguna</Link>
                    <Link to="/admin/platform-status" style={navLinkStyle}>Status Platform</Link>
                    <hr />
                    <h4 style={{paddingLeft: '15px', color: '#95a5a6'}}>Operasi Lapangan</h4>
                    <Link to="/admin/manual-data" style={navLinkStyle}>Input Data Manual</Link>
                    <Link to="/admin/sensors" style={navLinkStyle}>Manajemen Sensor</Link>
                    <Link to="/admin/samples" style={navLinkStyle}>Manajemen Sampel</Link>
                </nav>
                <button onClick={handleLogout} style={logoutButtonStyle}>Logout</button>
            </aside>
            <main style={contentStyle}>
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;