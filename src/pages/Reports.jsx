import React, { useState, useEffect } from 'react';
import { FileText, Image, Calendar, Download, Eye, Loader2 } from 'lucide-react';

const Reports = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/records');
        const data = await response.json();
        setRecords(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching records:", error);
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <Loader2 className="w-8 h-8 animate-spin text-medical-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">My Reports</h1>
        <p className="text-slate-500 mt-2">View and download your past medical scans and lab results.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {records.map((record) => (
          <div key={record._id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${record.fileType === 'ultrasound' ? 'bg-indigo-50 text-indigo-600' : 'bg-purple-50 text-purple-600'}`}>
                {record.fileType === 'ultrasound' ? <Image className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                record.riskScore === 'HEALTHY' ? 'bg-emerald-100 text-emerald-700' :
                record.riskScore === 'WARNING' ? 'bg-amber-100 text-amber-700' :
                record.riskScore === 'CRITICAL ALERT' ? 'bg-rose-100 text-rose-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {record.riskScore}
              </span>
            </div>
            
            <h3 className="font-bold text-slate-800 text-lg mb-1 truncate" title={record.fileName}>
              {record.fileName}
            </h3>
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-6">
              <Calendar className="w-4 h-4" />
              {new Date(record.uploadDate).toLocaleDateString()}
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
              <button className="flex-1 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2 rounded-lg text-sm font-semibold transition-colors">
                <Eye className="w-4 h-4" /> View
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 bg-medical-50 hover:bg-medical-100 text-medical-700 py-2 rounded-lg text-sm font-semibold transition-colors">
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          </div>
        ))}

        {records.length === 0 && (
          <div className="col-span-full p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No reports found</h3>
            <p className="text-slate-500">You haven't uploaded any medical records yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;