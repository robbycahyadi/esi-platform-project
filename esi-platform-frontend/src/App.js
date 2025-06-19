import logo from './logo.svg';
import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ServiceRequestPage from './pages/ServiceRequestPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import MyAccountPage from './pages/MyAccountPage';
import AnalyticsPage from './pages/AnalyticsPage';
import PrivateLayout from './components/PrivateLayout';
import AdminLayout from './components/AdminLayout';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSchedulingPage from './pages/AdminSchedulingPage';
import AdminLabInputPage from './pages/AdminLabInputPage';
import AdminUserManagementPage from './pages/AdminUserManagementPage';
import AdminSensorManagementPage from './pages/AdminSensorManagementPage';
import AdminSampleLogisticsPage from './pages/AdminSampleLogisticsPage';
import AdminManualDataPage from './pages/AdminManualDataPage';
import AdminPlatformStatusPage from './pages/AdminPlatformStatusPage';

// IMPORT SERVICE PROVIDER
import { ServiceProvider } from './context/ServiceContext'; 

// Route Protector untuk Pelanggan
const PrivateRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    // Hanya izinkan akses jika role bukan admin (atau null/customer)
    if (!isAuthenticated || role === 'admin') {
        return <Navigate to="/login" />;
    }
    return <PrivateLayout>{children}</PrivateLayout>;
};

// Route Protector untuk Admin
const AdminRoute = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    const role = localStorage.getItem('userRole');
    if (!isAuthenticated || role !== 'admin') {
        return <Navigate to="/login" />;
    }
    return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <ServiceProvider>
      {/* Provider untuk ServiceContext */}
      {/* Ini akan membungkus seluruh aplikasi sehingga semua komponen bisa mengakses data layanan */}
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          {/* Rute Privat untuk Pelanggan */}
            <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
            <Route path="/request-service" element={<PrivateRoute><ServiceRequestPage /></PrivateRoute>} />
            <Route path="/service/:requestId" element={<PrivateRoute><ServiceDetailPage /></PrivateRoute>} />
            <Route path="/my-account" element={<PrivateRoute><MyAccountPage /></PrivateRoute>} />
            <Route path="/analytics" element={<PrivateRoute><AnalyticsPage /></PrivateRoute>} />

            {/* Rute Privat untuk Admin */}
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
            <Route path="/admin/scheduling" element={<AdminRoute><AdminSchedulingPage /></AdminRoute>} />
            <Route path="/admin/lab-input" element={<AdminRoute><AdminLabInputPage /></AdminRoute>} />
            <Route path="/admin/user-management" element={<AdminRoute><AdminUserManagementPage /></AdminRoute>} />
            <Route path="/admin/sensors" element={<AdminRoute><AdminSensorManagementPage /></AdminRoute>} />
            <Route path="/admin/samples" element={<AdminRoute><AdminSampleLogisticsPage /></AdminRoute>} />
            <Route path="/admin/manual-data" element={<AdminRoute><AdminManualDataPage /></AdminRoute>} />
            <Route path="/admin/platform-status" element={<AdminRoute><AdminPlatformStatusPage /></AdminRoute>} />

          {/* Tambahkan route lain di sini nanti */}
        </Routes>
      </Router>
    </ServiceProvider>
  );
}

export default App;
