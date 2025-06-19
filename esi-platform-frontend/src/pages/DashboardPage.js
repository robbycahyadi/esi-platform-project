import React, { useEffect, useContext } from 'react';
import { ServiceContext } from '../context/ServiceContext';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Menggunakan API client terpusat
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Style Definitions ---
const kpiCardStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    flex: 1,
    textAlign: 'center'
};
const gridContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' };
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '30px' };

// --- Dummy Data (Hanya untuk widget yang belum ada backend-nya) ---
const kpiDummyData = {
    criticalParam: { name: 'PM 2.5', value: 58, status: 'Waspada' },
    unpaidInvoices: 1
};
const recentTrendData = [
    { day: 'Sen', pm25: 32 }, { day: 'Sel', pm25: 45 }, { day: 'Rab', pm25: 41 },
    { day: 'Kam', pm25: 58 }, { day: 'Jum', pm25: 55 }, { day: 'Sab', pm25: 38 }, { day: 'Min', pm25: 35 }
];
const recentActivities = [
    { time: '2 jam lalu', activity: 'Laporan untuk layanan REQ2024 telah terbit.' },
    { time: '1 hari lalu', activity: 'Anomali terdeteksi pada Sensor SENS1001.' },
];


const DashboardPage = () => {
     // Ambil data, loading, dan error dari context
    const { services, loading, error } = useContext(ServiceContext);
    // Tampilan loading dan error
    if (loading) return <div>Memuat data layanan...</div>;
    if (error) return <div style={{ color: 'red' }}>{error}</div>;

    const getKpiColor = (status) => {
        if (status === 'Bahaya') return '#e57373';
        if (status === 'Waspada') return '#ffb74d';
        return '#81c784';
    };
    
    // Data untuk KPI yang dihitung dari data nyata
    const activeServicesCount = services.filter(s => s.status !== 'Selesai').length;
    const newReportsCount = services.filter(s => s.status === 'Selesai').length;


    return (
        <div style={{ padding: '40px', backgroundColor: '#f4f7f6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Dashboard Pelanggan</h1>
                <Link to="/request-service" style={{ padding: '10px 20px', background: '#28a745', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
                    Ajukan Layanan Baru
                </Link>
            </div>
            
            {/* --- Bagian KPI Cards (Gabungan data nyata dan dummy) --- */}
            <div style={gridContainerStyle}>
                <div style={kpiCardStyle}>
                    <h3 style={{ margin: 0, color: '#555' }}>Parameter Kritis </h3>
                    <p style={{ fontSize: '28px', margin: '10px 0', fontWeight: 'bold', color: getKpiColor(kpiDummyData.criticalParam.status) }}>
                        {kpiDummyData.criticalParam.value} <span style={{fontSize: '16px'}}>µg/m³</span>
                    </p>
                </div>
                <div style={kpiCardStyle}>
                    <h3 style={{ margin: 0, color: '#555' }}>Layanan Aktif</h3>
                    <p style={{ fontSize: '36px', margin: '10px 0', fontWeight: 'bold', color: '#007BFF' }}>{loading ? '...' : activeServicesCount}</p>
                </div>
                <div style={kpiCardStyle}>
                    <h3 style={{ margin: 0, color: '#555' }}>Laporan Baru</h3>
                    <p style={{ fontSize: '36px', margin: '10px 0', fontWeight: 'bold', color: '#28a745' }}>{loading ? '...' : newReportsCount}</p>
                </div>
                 <div style={kpiCardStyle}>
                    <h3 style={{ margin: 0, color: '#555' }}>Tagihan Belum Dibayar</h3>
                    <p style={{ fontSize: '36px', margin: '10px 0', fontWeight: 'bold', color: '#ffc107' }}>{kpiDummyData.unpaidInvoices}</p>
                </div>
            </div>

            {/* --- Grafik, Tabel Layanan, dan Aktivitas --- */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
                {/* Kolom Kiri */}
                <div>
                    <div style={cardStyle}>
                        <h4>Tabel Layanan</h4>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{textAlign: 'left'}}>
                                    <th>ID Permintaan</th><th>Jenis Layanan</th><th>Lokasi</th><th>Status</th><th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {services.map(service => (
                                    <tr key={service.requestid}>
                                        <td>{service.requestid.substring(0, 8)}...</td>
                                        <td>{service.type}</td>
                                        {/* TAMBAHKAN DATA LOKASI */}
                                        <td>{service.location}</td>
                                        <td>{service.status}</td>
                                        <td><Link to={`/service/${service.requestid}`}>Lihat Detail</Link></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Kolom Kanan */}
                <div>
                    <div style={cardStyle}>
                        <h4>Tren PM 2.5 </h4>
                        <ResponsiveContainer width="100%" height={150}>
                            <LineChart data={recentTrendData}><XAxis dataKey="day" /><Tooltip /><Line type="monotone" dataKey="pm25" stroke="#8884d8" /></LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={cardStyle}>
                        <h4>Aktivitas Terbaru </h4>
                        <ul style={{ listStyle: 'none', padding: 0 }}>
                            {recentActivities.map((act, i) => (
                                <li key={i} style={{ borderBottom: '1px solid #eee', padding: '10px 0' }}>
                                    <p style={{ margin: 0 }}>{act.activity}</p>
                                    <small style={{ color: '#777' }}>{act.time}</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;