import React, { useState, useEffect } from 'react';
import { Users, AlertTriangle, Activity, Clock, ChevronRight, Filter } from 'lucide-react';

const DoctorDashboard = () => {
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllRecords = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/records');
        const data = await response.json();
        setAllRecords(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching all records:", error);
        setLoading(false);
      }
    };
    fetchAllRecords();
  }, []);

  // Calculate dynamic triage stats
  const criticalCount = allRecords.filter(r => r.riskScore === 'CRITICAL ALERT').length;
  const warningCount = allRecords.filter(r => r.riskScore === 'WARNING').length;
  const pendingCount = allRecords.filter(r => r.riskScore === 'Pending').length;

  const getRowStyle = (score) => {
    if (score === 'CRITICAL ALERT') return 'bg-rose-50/50 hover:bg-rose-50';
    if (score === 'WARNING') return 'hover:bg-amber-50/30';
    return 'hover:bg-slate-50';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-700 bg-slate-50 min-h-screen">
      <header className="mb-10 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Triage Overview</h1>
          <p className="text-slate-500 mt-2 font-medium">AI-Assisted Patient Monitoring Hub</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50">
          <Filter className="w-4 h-4" /> Filter by Risk
        </button>
      </header>

      {/* Triage Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 font-semibold">
            <Users className="w-5 h-5" /> Total Scans
          </div>
          <p className="text-3xl font-black text-slate-800">{allRecords.length}</p>
        </div>
        <div className="bg-rose-500 p-6 rounded-2xl shadow-md text-white">
          <div className="flex items-center gap-3 mb-2 font-bold opacity-90">
            <AlertTriangle className="w-5 h-5" /> Critical Alerts
          </div>
          <p className="text-3xl font-black">{criticalCount}</p>
        </div>
        <div className="bg-amber-500 p-6 rounded-2xl shadow-md text-white">
          <div className="flex items-center gap-3 mb-2 font-bold opacity-90">
            <Activity className="w-5 h-5" /> Warnings
          </div>
          <p className="text-3xl font-black">{warningCount}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 text-slate-500 mb-2 font-semibold">
            <Clock className="w-5 h-5" /> Pending Reviews
          </div>
          <p className="text-3xl font-black text-slate-800">{pendingCount}</p>
        </div>
      </div>

      {/* Patient Database */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider bg-slate-50/80">
              <th className="px-6 py-4 font-bold">Patient ID</th>
              <th className="px-6 py-4 font-bold">Scan Type</th>
              <th className="px-6 py-4 font-bold">Date Uploaded</th>
              <th className="px-6 py-4 font-bold">AI Diagnosis</th>
              <th className="px-6 py-4 font-bold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {allRecords.map((record) => (
              <tr key={record._id} className={`transition-colors ${getRowStyle(record.riskScore)}`}>
                <td className="px-6 py-4 font-bold text-slate-700">{record.patientId || 'PT-9921'}</td>
                <td className="px-6 py-4">
                  <span className="text-sm font-semibold text-slate-600 capitalize">
                    {record.fileType.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-slate-500">
                  {new Date(record.uploadDate).toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wide ${
                    record.riskScore === 'CRITICAL ALERT' ? 'bg-rose-100 text-rose-700' :
                    record.riskScore === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                    record.riskScore === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {record.riskScore}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="inline-flex items-center gap-1 text-sm font-bold text-medical-600 hover:text-medical-800 transition-colors">
                    Review Case <ChevronRight className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DoctorDashboard;