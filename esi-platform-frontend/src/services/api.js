import axios from 'axios';
import API_BASE_URL from '../config';

// Buat instance axios baru
const api = axios.create({
    baseURL: API_BASE_URL
});

// Gunakan "interceptor" untuk menyisipkan token ke setiap request secara otomatis
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;