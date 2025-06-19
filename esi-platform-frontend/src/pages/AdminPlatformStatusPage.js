import React from 'react';

// --- Style Definitions ---
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', boxSizing: 'border-box' };
const gridContainerStyle = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' };
const twoColumnGridStyle = { display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' };

// --- Komponen kecil untuk Bar Penggunaan Resource ---
const ResourceBar = ({ percentage, color }) => (
    <div style={{ width: '100%', background: '#eee', borderRadius: '4px' }}>
        <div style={{ width: `${percentage}%`, background: color, height: '20px', borderRadius: '4px', textAlign: 'center', color: 'white', lineHeight: '20px' }}>
            {percentage}%
        </div>
    </div>
);

// --- Dummy Data untuk Mockup ---
const servicesStatus = [
    { name: 'account-service', status: 'Online', cpu: 35, memory: 55 },
    { name: 'request-service', status: 'Online', cpu: 45, memory: 60 },
    { name: 'schedule-service', status: 'Online', cpu: 25, memory: 40 },
    { name: 'lab-data-service', status: 'Waspada', cpu: 75, memory: 80 },
    { name: 'field-operations-service', status: 'Online', cpu: 50, memory: 65 },
    { name: 'reporting-service', status: 'Offline', cpu: 0, memory: 0 },
    { name: 'analytics-service', status: 'Online', cpu: 65, memory: 70 },
];

const systemLogs = [
    { time: '19:15:02', level: 'INFO', service: 'api-gateway', message: 'POST /api/schedule/assign responded 201' },
    { time: '19:15:00', level: 'INFO', service: 'schedule-service', message: 'Schedule created successfully for REQ-008' },
    { time: '19:14:30', level: 'WARN', service: 'lab-data-service', message: 'Database connection pool nearing limit (8/10)' },
    { time: '19:13:55', level: 'ERROR', service: 'reporting-service', message: 'Service cannot connect to message broker' },
];

const AdminPlatformStatusPage = () => {
    const getStatusColor = (status) => {
        if (status === 'Online') return 'green';
        if (status === 'Waspada') return 'orange';
        return 'red';
    };

    return (
        <div>
            <h1>Manajemen & Status Platform</h1>
            
            {/* --- Bagian Ringkasan Umum --- */}
            <div style={gridContainerStyle}>
                <div style={cardStyle}><h4>Status Sistem Keseluruhan</h4><p style={{fontSize: '1.5em', fontWeight: 'bold', color: 'green', margin:0}}>BERJALAN NORMAL</p></div>
                <div style={cardStyle}><h4>API Gateway Latency</h4><p style={{fontSize: '1.5em', fontWeight: 'bold', margin:0}}>45 ms</p></div>
                <div style={cardStyle}><h4>Tingkat Error (24 Jam)</h4><p style={{fontSize: '1.5em', fontWeight: 'bold', color: 'orange', margin:0}}>0.5%</p></div>
                <div style={cardStyle}><h4>Koneksi Database Aktif</h4><p style={{fontSize: '1.5em', fontWeight: 'bold', margin:0}}>12 / 50</p></div>
            </div>

            <div style={twoColumnGridStyle}>
                {/* --- Kolom Kiri: Status Microservice --- */}
                <div style={cardStyle}>
                    <h3>Status Kesehatan Microservice</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{textAlign: 'left', borderBottom: '1px solid #eee'}}>
                                <th style={{padding: '8px'}}>Layanan</th><th style={{padding: '8px'}}>Status</th><th style={{padding: '8px'}}>Penggunaan CPU</th><th style={{padding: '8px'}}>Penggunaan Memori</th>
                            </tr>
                        </thead>
                        <tbody>
                            {servicesStatus.map(service => (
                                <tr key={service.name}>
                                    <td style={{padding: '10px 8px'}}>{service.name}</td>
                                    <td style={{padding: '10px 8px'}}><strong style={{color: getStatusColor(service.status)}}>{service.status}</strong></td>
                                    <td style={{padding: '10px 8px'}}><ResourceBar percentage={service.cpu} color="#2980b9" /></td>
                                    <td style={{padding: '10px 8px'}}><ResourceBar percentage={service.memory} color="#f39c12" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- Kolom Kanan: Log Sistem --- */}
                <div style={cardStyle}>
                    <h3 style={{marginTop:0}}>Log Sistem Real-time</h3>
                    <div style={{background: '#2c3e50', color: 'white', fontFamily: 'monospace', padding: '15px', borderRadius: '4px', height: '300px', overflowY: 'scroll'}}>
                        {systemLogs.map((log, i) => (
                            <div key={i} style={{marginBottom: '5px'}}>
                                <span style={{color: '#7f8c8d'}}>{log.time}</span>
                                <span style={{color: log.level==='INFO'?'#2ecc71':(log.level==='WARN'?'#f1c40f':'#e74c3c'), fontWeight:'bold', margin: '0 10px'}}>[{log.level}]</span>
                                <span style={{color: '#95a5a6'}}>[{log.service}]</span>
                                <span style={{marginLeft: '10px'}}>{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
export default AdminPlatformStatusPage;