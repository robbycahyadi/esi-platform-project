import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- Style Definitions ---
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', height: '100%', boxSizing: 'border-box' };
const kpiCardStyle = { ...cardStyle, textAlign: 'center' };
const topGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '20px' };
const mainContentStyle = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' };

// --- Dummy Data ---
const kpis = { newRequests: 2, inProgress: 8, onlineSensors: 15, systemStatus: 'Optimal' };
const urgentRequests = [{ id: 'REQ2026', customer: 'PT. Manufaktur Jaya' }, { id: 'REQ2027', customer: 'PT. Energi Prima' }];
const technicianStatus = [{ name: 'Budi Hartono', status: 'Tersedia' }, { name: 'Citra Lestari', status: 'On-Duty' }];
const workloadForecast = [{ day: 'Besok', jobs: 5 }, { day: 'Lusa', jobs: 2 }, { day: 'H+3', jobs: 4 }];
const recentSamples = [{ sampleId: 'SMPL00125', reqId: 'REQ2027' }, { sampleId: 'SMPL00126', reqId: 'REQ2026' }];
const sensorNetworkSummary = [{ sensorId: 'SENS1001', status: 'Online' }, { sensorId: 'SENS1002', status: 'Offline' }];

const AdminDashboardPage = () => {

    const [urgentRequests, setUrgentRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUrgentRequests = async () => {
            try {
                // Panggil endpoint baru kita melalui Gateway
                const response = await api.get('/api/service/requests/pending');
                setUrgentRequests(response.data);
            } catch (error) {
                console.error("Gagal memuat permintaan mendesak:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUrgentRequests();
    }, []);

    if (loading) return <div>Memuat data dashboard...</div>;
    return (
        <div>
            <h1>Pusat Komando Operasional</h1>

            {/* --- Baris 1: KPI Cards --- */}
            <div style={topGridStyle}>
                <div style={kpiCardStyle}><h4>Permintaan Baru</h4><p style={{ fontSize: '2em', fontWeight: 'bold', margin:0 }}>{kpis.newRequests}</p></div>
                <div style={kpiCardStyle}><h4>Layanan Diproses</h4><p style={{ fontSize: '2em', fontWeight: 'bold', margin:0 }}>{kpis.inProgress}</p></div>
                <div style={kpiCardStyle}><h4>Sensor Online</h4><p style={{ fontSize: '2em', fontWeight: 'bold', margin:0 }}>{kpis.onlineSensors}</p></div>
                <div style={kpiCardStyle}><h4>Status Sistem</h4><p style={{ fontSize: '2em', fontWeight: 'bold', margin:0, color: 'green' }}>{kpis.systemStatus}</p></div>
            </div>

            {/* --- Baris 2: Konten Operasional Utama (3 Kolom) --- */}
            <div style={mainContentStyle}>
                {/* Kolom 1: Tindakan & Tim */}
                <div style={{...cardStyle, display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <div>
                        <h3 style={{marginTop:0}}>Perlu Tindakan Segera</h3>
                        {loading ? <p>Memuat...</p> : (
                            urgentRequests.map(req => (
                                <div key={req.requestid}>
                                    <p>
                                        <strong>{req.requestid.substring(0,8)}...</strong> - {req.customer_name} ({req.type})
                                        {/* Link ini akan membawa ID request ke halaman penjadwalan */}
                                        <Link to={`/admin/scheduling?requestId=${req.requestid}`}>
                                            <button style={{marginLeft: '10px'}}>Jadwalkan</button>
                                        </Link>
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                    <div>
                        <h4 style={{marginTop:0}}>Status Teknisi</h4>
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {technicianStatus.map(tech => (
                                <li key={tech.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
                                    <span>{tech.name}</span>
                                    <span style={{ color: tech.status==='Tersedia'?'green':'orange', fontWeight: 'bold' }}>{tech.status}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Kolom 2: Monitor Lapangan (Ringkasan dengan Link) */}
                <div style={{...cardStyle, display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <div>
                        <h4 style={{marginTop:0}}>Jaringan Sensor</h4>
                        {sensorNetworkSummary.map(s => (<p key={s.sensorId}>{s.sensorId} - <span style={{color: s.status==='Online'?'green':'red'}}>{s.status}</span></p>))}
                        <Link to="/admin/sensors">Kelola Semua Sensor →</Link>
                    </div>
                     <div>
                        <h4 style={{marginTop:0}}>Log Sampel Terbaru</h4>
                        {recentSamples.map(s => (<p key={s.sampleId}>{s.sampleId} (dari {s.reqId})</p>))}
                        <Link to="/admin/samples">Lihat Semua Log Sampel →</Link>
                    </div>
                </div>

                {/* Kolom 3: Perkiraan Beban Kerja */}
                <div style={cardStyle}>
                    <h3 style={{marginTop:0}}>Perkiraan Beban Kerja</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={workloadForecast} layout="vertical">
                            <XAxis type="number" /><YAxis type="category" dataKey="day" width={80} /><Tooltip /><Bar dataKey="jobs" fill="#8884d8" name="Jumlah Tugas"/>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};
export default AdminDashboardPage;