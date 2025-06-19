import React, { useState, useEffect } from 'react';
import api from '../services/api';

const cardStyle = { backgroundColor: 'white', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' };
const inputStyle = { width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' };

const AdminUserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({ name: '', email: '', organization: '', role: 'customer', password: '' });

    // Fungsi untuk mengambil data dari backend
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/account/users'); // Panggil endpoint GET
            setUsers(response.data);
        } catch (error) {
            console.error("Gagal mengambil data pengguna:", error);
        } finally {
            setLoading(false);
        }
    };

    // Panggil fetchUsers saat komponen pertama kali dimuat
    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({ name: user.name, email: user.email, organization: user.organization, role: user.role, password: '' });
        setIsFormVisible(true);
    };

    const handleAddNew = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', organization: '', role: 'customer', password: '' });
        setIsFormVisible(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm(`Yakin ingin menghapus pengguna ini?`)) {
            await api.delete(`/api/account/users/${userId}`);
            fetchUsers(); // Ambil ulang data terbaru setelah delete
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const userData = { name: formData.name, email: formData.email, role: formData.role, organization: formData.organization };

        if (editingUser) {
            // Logika UPDATE ke backend
            await api.put(`/api/account/users/${editingUser.userid}`, userData);
        } else {
            // Logika CREATE ke backend
            await api.post('/api/account/register', { ...userData, password: formData.password });
        }
        fetchUsers(); // Ambil ulang data terbaru setelah create/update
        setIsFormVisible(false);
    };

    if (loading) return <div>Memuat pengguna...</div>;

    return (
        <div>
            <h1>Manajemen Pengguna</h1>
            {!isFormVisible && <button onClick={handleAddNew} style={{marginBottom: '20px'}}>+ Tambah Pengguna Baru</button>}
            
            {isFormVisible && (
                <div style={cardStyle}>
                    <h3>{editingUser ? `Edit Pengguna: ${editingUser.name}` : 'Tambah Pengguna Baru'}</h3>
                    <form onSubmit={handleSubmit}>
                        {/* Form inputs for name, email, organization, role, password */}
                        <input name="name" placeholder="Nama Lengkap" style={inputStyle} value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required/>
                        <input name="email" placeholder="Email" style={inputStyle} value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required/>
                        {!editingUser && <input name="password" type="password" placeholder="Password" style={inputStyle} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required/>}
                        <select name="role" style={inputStyle} value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})}>
                            <option value="customer">Customer</option><option value="technician">Technician</option><option value="admin">Admin</option>
                        </select>
                        <button type="submit">{editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}</button>
                        <button type="button" onClick={() => setIsFormVisible(false)} style={{marginLeft: '10px'}}>Batal</button>
                    </form>
                </div>
            )}

            <div style={cardStyle}>
                <h3>Daftar Pengguna</h3>
                <table style={{ width: '100%' }}>
                    <thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Aksi</th></tr></thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.userid}>
                                <td>{user.name}</td><td>{user.email}</td><td>{user.role}</td>
                                <td>
                                    <button onClick={() => handleEdit(user)}>Edit</button>
                                    <button onClick={() => handleDelete(user.userid)} style={{ marginLeft: '5px' }}>Hapus</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
export default AdminUserManagementPage;