// src/context/ServiceContext.js

import React, { createContext, useState, useEffect } from 'react';
import api from '../services/api'; // Import API client kita

// 1. Membuat Context
export const ServiceContext = createContext();

// 2. Membuat Provider (Penyedia data)
export const ServiceProvider = ({ children }) => {
    // State untuk menyimpan data, status loading, dan error
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Fungsi untuk mengambil data dari backend
    const fetchServices = async () => {
        try {
            setLoading(true);
            // Panggil endpoint di request-service menggunakan API client kita
            const response = await api.get('http://localhost:5000/api/service/requests');
            setServices(response.data);
            setError('');
        } catch (err) {
            setError('Gagal memuat data layanan dari server.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Jalankan fetchServices saat komponen pertama kali dimuat
    useEffect(() => {
        // Cek apakah ada token, karena endpoint ini terproteksi
        if (localStorage.getItem('authToken')) {
            fetchServices();
        } else {
            setLoading(false); // Jika tidak ada token, tidak perlu loading
        }
    }, []);

    // Fungsi untuk dipanggil setelah request baru berhasil dibuat
    // Ini akan mengambil ulang data untuk menampilkan data terbaru
    const refreshServices = () => {
        fetchServices();
    };

    // Fungsi ini bisa kita kembangkan nanti untuk menambah layanan baru secara dinamis
    const addService = (newService) => {
        setServices(prevServices => [newService, ...prevServices]);
    };

    // Nilai yang akan dibagikan ke semua komponen
    const value = {
        services,
        setServices,
        loading,
        error,
        refreshServices,
        addService
    };

    return (
        <ServiceContext.Provider value={value}>
            {children}
        </ServiceContext.Provider>
    );
};