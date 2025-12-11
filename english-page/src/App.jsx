import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePageContent from './components/pages/HomePageContent';
import Login from './components/pages/Login';
import Dashboard from './components/pages/admin/Dashboard';
import LeadsPage from './components/pages/admin/LeadsPage';
import ProtectedRoute from './components/admin/ProtectedRoute';
import './index.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route 
          path="/" 
          element={
            <>
              <Header />
              <HomePageContent />
              <Footer />
            </>
          } 
        />
        
        <Route path="/login" element={<Login />} />

        {/* Rotas Protegidas (Admin) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/leads"
          element={
            <ProtectedRoute>
              <LeadsPage />
            </ProtectedRoute>
          }
        />

        {/* Rota não encontrada - redireciona para home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;