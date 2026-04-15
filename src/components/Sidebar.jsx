import React from 'react';
import { LayoutDashboard, FileText, Calendar, UploadCloud, MessageSquare, Settings, Activity } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ userType = 'patient' }) => {
  const location = useLocation();
  
  // Menu items change based on who is logged in
  const menus = {
    patient: [
      { name: 'Overview', icon: LayoutDashboard, path: '/patient-dashboard' },
      { name: 'My Reports', icon: FileText, path: '/reports' },
      { name: 'Upload Scan', icon: UploadCloud, path: '/upload' },
      { name: 'Appointments', icon: Calendar, path: '/appointments' },
      { name: 'AI Assistant', icon: MessageSquare, path: '/chat' },
    ],
    doctor: [
      { name: 'Patient List', icon: Activity, path: '/doctor-dashboard' },
      { name: 'Appointments', icon: Calendar, path: '/doctor-appointments' },
    ]
  };

  const currentMenu = menus[userType] || menus.patient;

  return (
    <div className="h-screen w-64 bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      <div className="p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-8 h-8 bg-medical-500 rounded-lg flex items-center justify-center">
          <Activity className="text-white w-5 h-5" />
        </div>
        <h1 className="text-xl font-bold text-slate-800">PregnaCare<span className="text-medical-500">.ai</span></h1>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {currentMenu.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              location.pathname === item.path 
                ? 'bg-medical-50 text-medical-600 font-semibold' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.name}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-r from-medical-500 to-medical-600 rounded-xl p-4 text-white">
          <p className="text-xs opacity-90">Upcoming Appointment</p>
          <p className="font-semibold text-sm mt-1">Dr. Sarah Wilson</p>
          <p className="text-xs opacity-75 mt-1">Tomorrow, 10:00 AM</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;