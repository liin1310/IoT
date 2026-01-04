import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Sensors from './pages/Sensors';
import Layout from './components/Layout';

function App() {
  const isAuth = !!localStorage.getItem('iot_token');

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuth ? <Navigate to="/dashboard" /> : <Navigate to="/login" />} />
        <Route element={isAuth ? <Layout /> : <Navigate to="/login" /> }>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/sensors" element={<Sensors />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;
