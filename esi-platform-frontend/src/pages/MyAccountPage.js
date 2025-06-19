import React, { useState } from 'react';

// (Gunakan style yang sudah ada dan tambahkan yang baru)
const pageContainerStyle = { padding: '40px', backgroundColor: '#f4f7f6', minHeight: '100vh' };
const cardStyle = { padding: '30px', borderRadius: '8px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', backgroundColor: 'white', maxWidth: '800px', margin: '20px auto' };
const h3Style = { borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '20px' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };
const buttonStyle = { padding: '10px 20px', border: 'none', borderRadius: '4px', backgroundColor: '#007BFF', color: 'white', cursor: 'pointer', fontSize: '16px' };
const payButtonStyle = {
    padding: '5px 10px',
    fontSize: '14px',
    backgroundColor: '#ffc107',
    color: 'black',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
};

// --- Data Dummy ---
const dummySubscription = { plan: 'Paket Enterprise', status: 'Aktif', nextBilling: '2025-07-18' };
const initialInvoices = [
    { id: 'INV5678', date: '2025-06-18', amount: 'Rp 5.000.000', status: 'Belum Lunas' },
    { id: 'INV5601', date: '2025-05-18', amount: 'Rp 5.000.000', status: 'Lunas' },
    { id: 'INV5543', date: '2025-04-18', amount: 'Rp 5.000.000', status: 'Lunas' },
];

const MyAccountPage = () => {
    const [profile, setProfile] = useState({ name: 'John Doe', email: 'user@example.com', organization: 'PT Industri Maju' });
    const [message, setMessage] = useState('');

    const [invoices, setInvoices] = useState(initialInvoices); // <-- Gunakan state untuk invoices


    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.id]: e.target.value });
    };

    const handleProfileUpdate = (e) => {
        e.preventDefault();
        // Mockup pemanggilan ke PUT /account/profile
        console.log('Updating profile:', { name: profile.name, organization: profile.organization });
        setMessage('Profil berhasil diperbarui!');
        setTimeout(() => setMessage(''), 3000);
    };

    // <-- FUNGSI UNTUK PROSES PEMBAYARAN -->
    const handlePayInvoice = (invoiceId) => {
        // Simulasi redirect ke payment gateway seperti Midtrans
        alert(`Anda akan diarahkan ke halaman pembayaran untuk Invoice ${invoiceId}.\n(Ini adalah simulasi)`);
        
        // Setelah "pembayaran" berhasil, update status invoice
        setTimeout(() => {
            setInvoices(prevInvoices => 
                prevInvoices.map(inv => 
                    inv.id === invoiceId ? { ...inv, status: 'Lunas' } : inv
                )
            );
            alert(`Pembayaran untuk Invoice ${invoiceId} berhasil!`);
        }, 2000);
    };

    return (
        <div style={pageContainerStyle}>
            <h1 style={{ textAlign: 'center' }}>Akun Saya</h1>

            {/* Bagian Profil Pengguna */}
            <div style={cardStyle}>
                <h3 style={h3Style}>Profil Pengguna</h3>
                {message && <p style={{ color: 'green' }}>{message}</p>}
                <form onSubmit={handleProfileUpdate}>
                    <label htmlFor="name">Nama Lengkap</label>
                    <input id="name" type="text" style={inputStyle} value={profile.name} onChange={handleChange} />
                    
                    <label htmlFor="email">Email (tidak dapat diubah)</label>
                    <input id="email" type="email" style={inputStyle} value={profile.email} disabled />

                    <label htmlFor="organization">Nama Perusahaan</label>
                    <input id="organization" type="text" style={inputStyle} value={profile.organization} onChange={handleChange} />
                    
                    <button type="submit" style={buttonStyle}>Simpan Perubahan</button>
                </form>
            </div>

            {/* Bagian Status Langganan */}
            <div style={cardStyle}>
                <h3 style={h3Style}>Status Langganan</h3>
                <p><strong>Paket Saat Ini:</strong> {dummySubscription.plan}</p>
                <p><strong>Status:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>{dummySubscription.status}</span></p>
                <p><strong>Tanggal Tagihan Berikutnya:</strong> {dummySubscription.nextBilling}</p>
            </div>

            {/* Bagian Riwayat Tagihan */}
            <div style={cardStyle}>
                <h3 style={h3Style}>Riwayat Tagihan</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        {/* ... (header tabel tetap sama) ... */}
                        <th style={{ padding: '8px', textAlign: 'left' }}>Tindakan</th>
                    </thead>
                    <tbody>
                        {/* <-- MODIFIKASI BAGIAN INI --> */}
                        {invoices.map(invoice => (
                            <tr key={invoice.id}>
                                <td style={{ padding: '8px' }}>{invoice.id}</td>
                                <td style={{ padding: '8px' }}>{invoice.date}</td>
                                <td style={{ padding: '8px' }}>{invoice.amount}</td>
                                <td style={{ padding: '8px', color: invoice.status === 'Lunas' ? 'green' : 'red', fontWeight: 'bold' }}>
                                    {invoice.status}
                                </td>
                                <td style={{ padding: '8px' }}>
                                    {invoice.status === 'Belum Lunas' && (
                                        <button onClick={() => handlePayInvoice(invoice.id)} style={payButtonStyle}>
                                            Bayar Sekarang
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MyAccountPage;