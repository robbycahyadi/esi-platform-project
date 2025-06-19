import React, { useState, useEffect } from 'react';
import api from '../services/api';

// --- Style Definitions ---
const cardStyle = { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '20px' };
const controlHeaderStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', padding: '0 10px' };
const calendarGridStyle = { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', border: '1px solid #ddd' };
const dayCellStyle = { minHeight: '150px', border: '1px solid #eee', padding: '8px', position: 'relative', display: 'flex', flexDirection: 'column', gap: '5px' };
const dayHeaderStyle = { padding: '10px', fontWeight: 'bold', textAlign: 'center', background: '#f9f9f9' };
const jobCardStyle = { background: '#eaf4ff', borderLeft: '4px solid #007BFF', padding: '5px 8px', borderRadius: '4px', fontSize: '0.8em', cursor: 'pointer' };
const reportReadyJobCardStyle = { ...jobCardStyle, borderLeftColor: '#28a745' };
const todayMarkerStyle = { background: '#ffffeb' };
const otherMonthDayStyle = { color: '#ccc' };
const modalOverlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
const modalContentStyle = { background: 'white', padding: '30px', borderRadius: '8px', width: '400px' };
const modalInputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };

const daysOfWeek = ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const AdminSchedulingPage = () => {
    // --- State Management ---
    const [currentDate, setCurrentDate] = useState(new Date());
    const [unassigned, setUnassigned] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [assignmentData, setAssignmentData] = useState({ technicianId: '', scheduledDate: '' });
    const [isEditMode, setIsEditMode] = useState(false);

    // --- Data Fetching ---
    const fetchData = async () => {
        setLoading(true);
        try {
            const [unassignedRes, schedulesRes, techsRes] = await Promise.all([
                api.get('/api/service/requests/pending'),
                api.get('/api/schedule/'),
                api.get('/api/account/users?role=technician')
            ]);
            setUnassigned(unassignedRes.data);
            setSchedules(schedulesRes.data);
            setTechnicians(techsRes.data);
        } catch (error) { console.error("Gagal memuat data:", error); } 
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // --- Calendar & Navigation Helpers ---
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        let days = Array.from({length: lastDate}, (_, i) => new Date(year, month, i + 1));
        let blanks = Array(firstDay).fill(null);
        return [...blanks, ...days];
    };
    const changeMonth = (amount) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + amount);
        setCurrentDate(newDate);
    };

    // --- Modal & Form Handlers ---
    const handleOpenCreateModal = (task) => {
        setSelectedTask(task);
        setIsEditMode(false);
        setAssignmentData({ technicianId: '', scheduledDate: '' });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (task) => {
        setSelectedTask(task);
        setIsEditMode(true);
        setAssignmentData({
            technicianId: task.technicianid,
            scheduledDate: new Date(task.scheduleddate).toISOString().split('T')[0]
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTask(null);
    };

    const handleModalSubmit = async (e) => {
        e.preventDefault();
        const payload = { technicianId: assignmentData.technicianId, scheduledDate: assignmentData.scheduledDate };
        try {
            if (isEditMode) {
                await api.put(`/api/schedule/${selectedTask.scheduleid}`, payload);
                alert('Jadwal berhasil diperbarui!');
            } else {
                await api.post('/api/schedule/assign', { ...payload, requestId: selectedTask.requestid });
                alert('Penjadwalan berhasil disimpan!');
            }
            handleCloseModal();
            fetchData();
        } catch (error) { alert('Gagal menyimpan jadwal.'); }
    };

    const handleDeleteSchedule = async () => {
        if (window.confirm(`Anda yakin ingin membatalkan jadwal ini?`)) {
            try {
                await api.delete(`/api/schedule/${selectedTask.scheduleid}`);
                alert('Jadwal berhasil dibatalkan.');
                handleCloseModal();
                fetchData();
            } catch (error) { alert('Gagal membatalkan jadwal.'); }
        }
    };
    
    const handleGenerateReport = async (requestId) => {
        if (window.confirm(`Selesaikan layanan ${requestId} dan buat laporannya?`)) {
            try {
                await api.post('/api/report/generate', { requestId });
                alert('Layanan berhasil diselesaikan!');
                fetchData();
            } catch (error) { alert('Gagal membuat laporan.'); }
        }
    };

    return (
        <div>
            <h1>Pusat Kontrol Penjadwalan</h1>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '20px' }}>
                <div style={cardStyle}>
                    <div style={controlHeaderStyle}>
                        <button onClick={() => changeMonth(-1)}>‹‹ Bulan</button>
                        <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{currentDate.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}</span>
                        <button onClick={() => changeMonth(1)}>Bulan ››</button>
                    </div>
                    <div style={calendarGridStyle}>
                        {daysOfWeek.map(day => <div key={day} style={dayHeaderStyle}>{day}</div>)}
                        {getDaysInMonth(currentDate).map((day, index) => {
                            const isToday = day && day.toDateString() === new Date().toDateString();
                            return (
                                <div key={index} style={{...dayCellStyle, ...(isToday && todayMarkerStyle)}}>
                                    <strong style={{...(!day && otherMonthDayStyle)}}>{day ? day.getDate() : ''}</strong>
                                    {day && schedules.filter(s => new Date(s.scheduleddate).toDateString() === day.toDateString())
                                        .map(task => {
                                            const isReadyForReport = task.request_status === 'Data Processing' || task.request_status === 'Dianalisis';
                                            return (
                                                <div key={task.scheduleid} style={isReadyForReport ? reportReadyJobCardStyle : jobCardStyle}>
                                                    <div onClick={() => handleOpenEditModal(task)}>
                                                        <strong>{task.technician_name}</strong><br />
                                                        <small>{task.customer_name}</small>
                                                    </div>
                                                    {isReadyForReport && (
                                                        <button onClick={() => handleGenerateReport(task.requestid)} style={{width: '100%', marginTop: '5px', fontSize: '0.9em', background: '#28a745', color: 'white', border:'none', cursor: 'pointer'}}>
                                                            Buat Laporan
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })
                                    }
                                </div>
                            );
                        })}
                    </div>
                </div>
                <div style={cardStyle}>
                    <h3 style={{marginTop: 0}}>Perlu Dijadwalkan ({unassigned.length})</h3>
                    <div style={{maxHeight: '70vh', overflowY: 'auto'}}>
                        {loading ? <p>Memuat...</p> : unassigned.map(task => (
                            <div key={task.requestid} style={{ border: '1px solid #ddd', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                                <strong>{task.requestid?.substring(0,8)}...</strong><br/>
                                <small>{task.customer_name} ({task.type})</small>
                                <button onClick={() => handleOpenCreateModal(task)} style={{ width: '100%', marginTop: '8px'}}>Tugaskan</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {isModalOpen && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle}>
                        <h3>{isEditMode ? 'Edit Jadwal' : 'Jadwalkan Tugas'}</h3>
                        <p><strong>Pelanggan:</strong> {selectedTask?.customer_name}</p>
                        <hr/>
                        <form onSubmit={handleModalSubmit}>
                            <label>Tugaskan ke Teknisi</label>
                            <select name="technicianId" value={assignmentData.technicianId} onChange={e => setAssignmentData({...assignmentData, technicianId: e.target.value})} style={modalInputStyle} required>
                                <option value="">-- Pilih Teknisi --</option>
                                {technicians.map(tech => <option key={tech.userid} value={tech.userid}>{tech.name}</option>)}
                            </select>
                            <label>Pilih Tanggal Penugasan</label>
                            <input name="scheduledDate" type="date" value={assignmentData.scheduledDate} onChange={e => setAssignmentData({...assignmentData, scheduledDate: e.target.value})} style={modalInputStyle} required />
                            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '20px'}}>
                                {isEditMode ? <button type="button" onClick={handleDeleteSchedule} style={{background: '#dc3545', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px'}}>Hapus Jadwal</button> : <div></div>}
                                <div>
                                    <button type="button" onClick={handleCloseModal}>Batal</button>
                                    <button type="submit" style={{marginLeft: '10px', background: '#007BFF', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '4px'}}>{isEditMode ? 'Simpan Perubahan' : 'Simpan Jadwal'}</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminSchedulingPage;