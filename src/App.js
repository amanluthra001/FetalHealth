import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Users } from 'lucide-react'; // Icon for our toggle button

// Components
import Sidebar from './components/Sidebar';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import Upload from './pages/Upload';
import Chatbot from './pages/Chatbot';
import Reports from './pages/Reports';
import Appointments from './pages/Appointments';

function App() {
  // 1. Create a state to track who is currently "logged in"
  const [userRole, setUserRole] = useState('patient'); // Defaults to patient

  // 2. A simple toggle function for testing purposes
  const toggleRole = () => {
    setUserRole(prevRole => prevRole === 'patient' ? 'doctor' : 'patient');
  };

  return (
    <Router>
      <div className="flex bg-slate-50 min-h-screen font-sans text-slate-900 relative">
        
        {/* 3. Pass the dynamic userRole to the Sidebar */}
        <Sidebar userType={userRole} />
        
        <main className="flex-1 ml-64 relative">
          
          {/* --- DEVELOPMENT ROLE TOGGLE BUTTON --- */}
          {/* This sits in the top right corner so you can easily switch views while building */}
          <div className="absolute top-6 right-8 z-50 animate-in fade-in">
            <button 
              onClick={toggleRole}
              className="flex items-center gap-2 bg-white border border-slate-200 px-5 py-2.5 rounded-full text-sm font-bold text-slate-600 shadow-sm hover:shadow-md hover:border-medical-300 transition-all"
            >
              <Users className="w-4 h-4 text-indigo-500" />
              View as: <span className="text-medical-600 capitalize">{userRole}</span>
            </button>
          </div>

          <div className="pt-4"> {/* Padding to prevent content from hiding under the button */}
            <Routes>
              {/* 4. Dynamically set the Home route based on who is logged in */}
              <Route path="/" element={
                userRole === 'patient' ? <PatientDashboard /> : <Navigate to="/doctor-dashboard" replace />
              } />
              
              {/* Patient Routes */}
              <Route path="/patient-dashboard" element={<PatientDashboard />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/appointments" element={<Appointments />} />
              <Route path="/chat" element={<Chatbot />} />
              
              {/* Doctor Routes */}
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
              {/* We'll map the doctor's appointment link to the appointments page for now */}
              <Route path="/doctor-appointments" element={<Appointments />} /> 
            </Routes>
          </div>

        </main>
      </div>
    </Router>
  );
}

export default App;