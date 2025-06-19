import React, { useContext, useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ServiceContext } from '../context/ServiceContext';
import api from '../services/api';

// --- Style Definitions ---
const pageContainerStyle = { padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh' };
const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', maxWidth: '800px', margin: '0 auto' };
const detailItemStyle = { marginBottom: '15px', display: 'flex', alignItems: 'center' };
const detailLabelStyle = { fontWeight: 'bold', width: '200px', flexShrink: 0 };
const buttonStyle = { padding: '10px 20px', border: 'none', borderRadius: '4px', color: 'white', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginRight: '10px' };
const timelineItemStyle = { paddingBottom: '20px', position: 'relative', borderLeft: '2px solid #ddd', marginLeft: '10px', paddingLeft: '30px' };
const timelineDotStyle = { content: '""', position: 'absolute', top: '5px', left: '-7px', height: '12px', width: '12px', background: '#007BFF', borderRadius: '50%' };

// Mockup Timeline Progress
const progressTimeline = [
    { status: 'Permintaan Diterima', date: '2025-06-18', notes: 'Permintaan telah dicatat oleh sistem.' },
    { status: 'Penjadwalan Teknisi', date: '2025-06-19', notes: 'Teknisi Budi Hartono telah ditugaskan.' },
    { status: 'Pengambilan Sampel', date: '2025-06-21', notes: 'Sampel berhasil diambil di lokasi pabrik Cikarang.' },
    { status: 'Analisis Laboratorium', date: '2025-06-22', notes: 'Sampel sedang dalam proses analisis di lab.' },
    { status: 'Laporan Dibuat', date: '2025-06-24', notes: 'Laporan akhir telah selesai dibuat dan siap diunduh.' },
];

const ServiceDetailPage = () => {
    // --- Hooks (semua dikumpulkan di atas) ---
    const { requestId } = useParams();
    const { services, loading: servicesLoading } = useContext(ServiceContext);
    const [consultationStatus, setConsultationStatus] = useState({ requested: false, message: '' });
    const [reportInfo, setReportInfo] = useState(null);
    const [reportError, setReportError] = useState('');

    // --- Pencarian Data & State Turunan ---
    const service = servicesLoading ? null : services.find(s => s.requestid === requestId);

    // --- Efek untuk mengambil info laporan jika layanan sudah Selesai ---
    useEffect(() => {
        // Reset state laporan setiap kali service berubah
        setReportInfo(null);
        setReportError('');

        if (service && service.status === 'Selesai') {
            const fetchReportInfo = async () => {
                try {
                    const response = await api.get(`/api/report/request/${service.requestid}`);
                    setReportInfo(response.data);
                } catch (err) {
                    console.error("Gagal mengambil info laporan", err);
                    setReportError('Informasi laporan tidak tersedia saat ini.');
                }
            };
            fetchReportInfo();
        }
    }, [service]); // Efek ini bergantung pada data 'service'

    // --- Event Handlers ---
    const handleDownloadReport = async () => {
        if (!reportInfo) {
            alert('Informasi laporan tidak valid.');
            return;
        }
        try {
            const response = await api.get(`/api/report/download/${reportInfo.reportid}`, {
                responseType: 'blob', // Penting: minta data sebagai file binary
            });

            // Buat URL sementara dari data file yang diterima
            const url = window.URL.createObjectURL(new Blob([response.data]));
            
            // Buat link sementara, klik, lalu hapus
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', reportInfo.fileurl); // Ambil nama file dari info laporan
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (error) {
            console.error('Gagal mengunduh file:', error);
            alert('Gagal mengunduh file laporan.');
        }
    };

    const handleRequestConsultation = () => {
        console.log(`Mengajukan permintaan konsultasi untuk layanan ID: ${service.requestid}`);
        setTimeout(() => {
            setConsultationStatus({
                requested: true,
                message: `Permintaan konsultasi berhasil diajukan. Tim kami akan segera menghubungi Anda.`
            });
        }, 1000);
    };

    // --- Tampilan Loading & Not Found ---
    if (servicesLoading) return <div style={pageContainerStyle}><div style={cardStyle}>Memuat data layanan...</div></div>;
    if (!service) {
        return (
            <div style={pageContainerStyle}>
                <div style={cardStyle}>
                    <h2>Layanan Tidak Ditemukan</h2>
                    <p>Permintaan layanan dengan ID: {requestId} tidak dapat ditemukan.</p>
                    <Link to="/">Kembali ke Dashboard</Link>
                </div>
            </div>
        );
    }
    
    // Kondisi untuk mengaktifkan tombol
    const isReportReady = service.status === 'Selesai' && reportInfo;

    return (
        <div style={pageContainerStyle}>
            <div style={cardStyle}>
                <Link to="/">← Kembali ke Dashboard</Link>
                <h2 style={{ marginTop: '20px' }}>Detail Layanan: {service.requestid.substring(0,8)}...</h2>
                
                <div style={detailItemStyle}><span style={detailLabelStyle}>Jenis Layanan:</span><span>{service.type}</span></div>
                <div style={detailItemStyle}><span style={detailLabelStyle}>Lokasi:</span><span>{service.location}</span></div>
                <div style={detailItemStyle}><span style={detailLabelStyle}>Tanggal Pengajuan:</span><span>{new Date(service.createdat).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                <div style={detailItemStyle}><span style={detailLabelStyle}>Status Saat Ini:</span><span style={{ fontWeight: 'bold', color: '#007BFF' }}>{service.status}</span></div>

                <div style={detailItemStyle}>
                    <span style={detailLabelStyle}>Tindakan:</span>
                    <div>
                        <button onClick={handleDownloadReport} disabled={!isReportReady} style={{ ...buttonStyle, backgroundColor: isReportReady ? '#28a745' : '#ccc', cursor: isReportReady ? 'pointer' : 'not-allowed' }}>
                            {isReportReady ? 'Unduh Laporan' : 'Laporan Belum Siap'}
                        </button>
                        <button onClick={handleRequestConsultation} disabled={!isReportReady || consultationStatus.requested} style={{ ...buttonStyle, backgroundColor: isReportReady && !consultationStatus.requested ? '#17a2b8' : '#ccc', cursor: isReportReady && !consultationStatus.requested ? 'pointer' : 'not-allowed' }}>
                            {consultationStatus.requested ? 'Permintaan Terkirim' : 'Minta Konsultasi'}
                        </button>
                    </div>
                </div>
                
                {reportError && <p style={{color: 'red'}}>{reportError}</p>}
                {consultationStatus.message && <p style={{color: 'green'}}>{consultationStatus.message}</p>}

                <h3 style={{ borderTop: '1px solid #eee', paddingTop: '30px', marginTop: '30px' }}>Riwayat Progres </h3>
                <div style={{ position: 'relative' }}>
                    {progressTimeline.map((item, index) => (
                        <div key={index} style={timelineItemStyle}>
                            <div style={timelineDotStyle}></div>
                            <p style={{ margin: 0, fontWeight: 'bold' }}>{item.status}</p>
                            <p style={{ margin: '5px 0', fontSize: '0.9em', color: '#555' }}>{item.date}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ServiceDetailPage;