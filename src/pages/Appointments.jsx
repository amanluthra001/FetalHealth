import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, MapPin, Video, Plus, User, X, Loader2 } from 'lucide-react';

const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // New appointment form state
  const [formData, setFormData] = useState({
    doctor: 'Dr. Sarah Jenkins',
    specialty: 'Obstetrician & Gynecologist',
    date: '',
    time: '10:00 AM',
    type: 'In-Person',
    location: 'City General Hospital, Wing B'
  });

  // Fetch appointments on load
  const fetchAppointments = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/appointments');
      const data = await response.json();
      setAppointments(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // Handle Booking Submission
  const handleBookSubmit = async (e) => {
    e.preventDefault();
    setIsBooking(true);

    try {
      const response = await fetch('http://localhost:5000/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchAppointments(); // Refresh the list
        setIsModalOpen(false); // Close modal
      }
    } catch (error) {
      console.error("Failed to book:", error);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto animate-in fade-in duration-500 relative">
      <header className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
          <p className="text-slate-500 mt-2">Manage your upcoming checkups and consultations.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-medical-600 hover:bg-medical-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-medical-500/30 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Book New
        </button>
      </header>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-medical-600" /> Upcoming Schedule
          </h2>
        </div>
        
        {loading ? (
          <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-medical-500" /></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <div className="p-10 text-center text-slate-500">No appointments scheduled.</div>
            ) : (
              appointments.map((apt) => (
                <div key={apt._id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center gap-4 md:w-1/3">
                    <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{apt.doctor}</h3>
                      <p className="text-sm text-slate-500">{apt.specialty}</p>
                    </div>
                  </div>

                  <div className="md:w-1/3">
                    <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1">
                      <CalendarIcon className="w-4 h-4 text-medical-500" /> {apt.date}
                    </div>
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Clock className="w-4 h-4" /> {apt.time}
                    </div>
                  </div>

                  <div className="md:w-1/3 flex flex-col items-start md:items-end gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-100 px-3 py-1 rounded-md">
                      {apt.type === 'Telehealth' ? <Video className="w-4 h-4 text-indigo-500" /> : <MapPin className="w-4 h-4 text-rose-500" />}
                      {apt.type}
                    </div>
                    <div className="flex gap-3">
                      <button className="text-sm font-semibold text-slate-500 hover:text-slate-700">Reschedule</button>
                      <button className="text-sm font-semibold text-medical-600 hover:text-medical-800">
                        {apt.type === 'Telehealth' ? 'Join Call' : 'Get Directions'}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold text-slate-800 mb-6">Book Appointment</h2>
            
            <form onSubmit={handleBookSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Select Doctor</label>
                <select 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-medical-500"
                  value={formData.doctor}
                  onChange={(e) => {
                    const doc = e.target.value;
                    const isTele = doc === 'Dr. Michael Chen';
                    setFormData({...formData, doctor: doc, type: isTele ? 'Telehealth' : 'In-Person', location: isTele ? 'Video Link provided via Email' : 'City General Hospital', specialty: isTele ? 'Fetal Medicine Specialist' : 'Obstetrician & Gynecologist'});
                  }}
                >
                  <option value="Dr. Sarah Jenkins">Dr. Sarah Jenkins (OB/GYN)</option>
                  <option value="Dr. Michael Chen">Dr. Michael Chen (Telehealth)</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Date</label>
                  <input type="date" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-medical-500" onChange={(e) => setFormData({...formData, date: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Time</label>
                  <input type="time" required className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2.5 outline-none focus:border-medical-500" onChange={(e) => setFormData({...formData, time: e.target.value})} />
                </div>
              </div>

              <button disabled={isBooking} type="submit" className="w-full mt-6 bg-medical-600 hover:bg-medical-700 text-white py-3 rounded-xl font-bold transition-colors">
                {isBooking ? 'Booking...' : 'Confirm Appointment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;