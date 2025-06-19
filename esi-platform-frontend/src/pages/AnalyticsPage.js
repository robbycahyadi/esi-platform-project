import React, { useState, useEffect } from 'react';
import { ComposedChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from 'recharts';
import api from '../services/api';

// --- Style Definitions ---
const pageContainerStyle = { padding: '40px', backgroundColor: '#f4f7f6' };
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', marginBottom: '30px' };
const filterContainerStyle = { display: 'flex', gap: '20px', marginBottom: '20px', alignItems: 'center' };
const inputStyle = { padding: '10px', border: '1px solid #ddd', borderRadius: '4px' };

// --- Dummy Data (untuk widget yang belum ada backend-nya) ---
const dummyInsights = [
    { type: 'trend', message: 'Terdeteksi tren kenaikan PM 2.5 pada jam kerja (08:00 - 17:00).', severity: 'medium' },
    { type: 'recommendation', message: 'Disarankan untuk memeriksa filter ventilasi di Zona B.', severity: 'low' }
];

const AnalyticsPage = () => {
    // --- State Management ---
    const [filters, setFilters] = useState({
        startDate: '2025-01-01',
        endDate: new Date().toISOString().split('T')[0], // Set tanggal akhir ke hari ini
        parameter: 'Kebisingan' // Parameter default, sesuaikan dengan data Anda
    });
    const [displayData, setDisplayData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Data Fetching ---
    useEffect(() => {
        const fetchData = async () => {
            if (!filters.parameter || !filters.startDate || !filters.endDate) return;
            
            setLoading(true);
            setError('');
            try {
                // Panggil endpoint trends dengan parameter dari state filter
                const response = await api.get('/api/analytics/trends', { params: filters });
                
                // Format data agar bisa dibaca oleh grafik
                const formattedData = response.data.map(d => ({
                    date: new Date(d.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
                    value: parseFloat(d.value)
                }));
                setDisplayData(formattedData);
                if (formattedData.length === 0) {
                    setError('Tidak ada data ditemukan untuk filter yang dipilih.');
                }
            } catch (err) {
                console.error("Gagal memuat data tren:", err);
                setError('Gagal memuat data dari server.');
                setDisplayData([]);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]); // Efek ini akan berjalan lagi setiap kali filter diubah

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    return (
        <div style={pageContainerStyle}>
            <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Analitik Data Lingkungan</h1>

            <div style={cardStyle}>
                <h3>Filter Data</h3>
                <div style={filterContainerStyle}>
                    <label>Parameter:</label>
                    <select name="parameter" style={inputStyle} value={filters.parameter} onChange={handleFilterChange}>
                        <option value="Kebisingan">Kebisingan</option>
                        <option value="PM 2.5">PM 2.5</option>
                        <option value="Pencahayaan">Pencahayaan</option>
                        <option value="CO2">CO2</option>
                    </select>
                    <label>Dari Tanggal:</label>
                    <input type="date" name="startDate" style={inputStyle} value={filters.startDate} onChange={handleFilterChange} />
                    <label>Hingga Tanggal:</label>
                    <input type="date" name="endDate" style={inputStyle} value={filters.endDate} onChange={handleFilterChange} />
                </div>
            </div>

            <div style={cardStyle}>
                <h3>Grafik Tren Data: {filters.parameter}</h3>
                {loading && <p>Memuat data grafik...</p>}
                {error && <p style={{ color: 'orange' }}>{error}</p>}
                {!loading && !error && (
                    <ResponsiveContainer width="100%" height={400}>
                        <ComposedChart data={displayData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="value" name={filters.parameter} stroke="#8884d8" strokeWidth={2} activeDot={{ r: 8 }} />
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
            
            <div style={cardStyle}>
                <h3>Anomali & Insight (AI-Powered)</h3>
                <ul style={{ listStyleType: 'none', padding: 0 }}>
                    {dummyInsights.map((insight, index) => (
                        <li key={index} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '4px', marginBottom: '10px' }}>
                            <strong style={{ textTransform: 'capitalize', color: insight.severity === 'medium' ? '#ff9800' : '#4caf50' }}>{insight.type}:</strong> {insight.message}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default AnalyticsPage;