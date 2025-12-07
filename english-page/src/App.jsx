import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Componentes Base
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';

// paginas
import HomePageContent from "./components/pages/HomePageContent.jsx";

// ❌ REMOVA esta linha:
// import './App.css'; 

// ✅ ADICIONE esta linha (se precisar de estilos globais do App):
import './App.module.css';  // ← ou simplesmente delete se não usar

const App = () => {
    return (
        <Router>
            <div className="english-page">
        
                <Header /> 
        
                <Routes>
                    <Route path="/" element={<HomePageContent />} /> 
                </Routes>

                <Footer /> 
            </div>
        </Router>
    );
};

export default App;