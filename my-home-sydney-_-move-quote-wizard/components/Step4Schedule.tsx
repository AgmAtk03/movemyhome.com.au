
import React, { useState, useMemo } from 'react';
import { MoveDetails } from '../types';

interface Step4Props {
  details: MoveDetails;
  onUpdateDetails: (d: Partial<MoveDetails>) => void;
}

const Step4Schedule: React.FC<Step4Props> = ({ details, onUpdateDetails }) => {
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);
  const [viewDate, setViewDate] = useState(new Date());
  const [timeMode, setTimeMode] = useState<'hour' | 'minute'>('hour');
  const [period, setPeriod] = useState<'AM' | 'PM'>(() => {
    if (!details.time) return 'AM';
    const [h] = details.time.split(':').map(Number);
    return h >= 12 ? 'PM' : 'AM';
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Formatting helpers
  const formattedDate = useMemo(() => {
    if (!details.date) return null;
    return new Date(details.date).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }, [details.date]);

  const formattedTime = useMemo(() => {
    if (!details.time) return null;
    const [h, m] = details.time.split(':').map(Number);
    const displayH = h % 12 || 12;
    const displayP = h >= 12 ? 'PM' : 'AM';
    return `${displayH}:${m.toString().padStart(2, '0')} ${displayP}`;
  }, [details.time]);

  // --- Calendar Logic ---
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  }, [viewDate]);

  const changeMonth = (offset: number) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const handleDateSelect = (date: Date) => {
    if (date < today) return;
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    onUpdateDetails({ date: localDate.toISOString().split('T')[0] });
    setActivePicker(null); // Close on selection
  };

  // --- Clock Logic ---
  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const currentHour = useMemo(() => {
    if (!details.time) return 9;
    let [h] = details.time.split(':').map(Number);
    h = h % 12;
    return h === 0 ? 12 : h;
  }, [details.time]);

  const currentMinute = useMemo(() => {
    if (!details.time) return 0;
    const [, m] = details.time.split(':').map(Number);
    return m;
  }, [details.time]);

  const setClockTime = (val: number, type: 'hour' | 'minute') => {
    let [h, m] = (details.time || "09:00").split(':').map(Number);
    
    if (type === 'hour') {
      let newH = val === 12 ? 0 : val;
      if (period === 'PM') newH += 12;
      h = newH;
      setTimeMode('minute');
    } else {
      m = val;
      setActivePicker(null); // Close on minute selection
    }

    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onUpdateDetails({ time: timeString });
  };

  const togglePeriod = (p: 'AM' | 'PM') => {
    setPeriod(p);
    let [h, m] = (details.time || "09:00").split(':').map(Number);
    h = h % 12;
    if (p === 'PM') h += 12;
    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onUpdateDetails({ time: timeString });
  };

  return (
    <div className="space-y-6 animate-premium-in pb-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 4: Schedule</h2>
        <p className="text-slate-500 text-sm font-medium">When should our team arrive?</p>
      </div>

      {/* Selector Tabs */}
      <div className="grid grid-cols-1 gap-4">
        {/* Date Selector Slot */}
        <button 
          onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
          className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all duration-300 text-left ${
            activePicker === 'date' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
          }`}
        >
          <div className={`w-14 h-14 flex items-center justify-center text-2xl rounded-2xl transition-all ${details.date ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <i className="ph-fill ph-calendar"></i>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Move Date</span>
            <span className={`text-lg font-black tracking-tight ${details.date ? 'text-slate-900' : 'text-slate-300 italic'}`}>
              {formattedDate || 'Select Date'}
            </span>
          </div>
          <i className={`ph-bold ph-caret-down text-slate-300 transition-transform duration-300 ${activePicker === 'date' ? 'rotate-180' : ''}`}></i>
        </button>

        {/* Date Picker Content */}
        {activePicker === 'date' && (
          <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
              <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <i className="ph-bold ph-caret-left"></i>
              </button>
              <h3 className="font-black text-sm tracking-tight uppercase">
                {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
              </h3>
              <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors">
                <i className="ph-bold ph-caret-right"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {['S','M','T','W','T','F','S'].map((d, i) => (
                  <div key={i} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const isToday = date.getTime() === today.getTime();
                  const isSelected = details.date === date.toISOString().split('T')[0];
                  const isPast = date < today;
                  return (
                    <button
                      key={i}
                      disabled={isPast}
                      onClick={() => handleDateSelect(date)}
                      className={`
                        relative h-11 flex flex-col items-center justify-center rounded-xl text-sm font-bold transition-all
                        ${isSelected ? 'bg-blue-600 text-white shadow-lg z-10' : ''}
                        ${isPast ? 'text-slate-200 cursor-not-allowed' : 'text-slate-700 hover:bg-blue-50'}
                        ${isToday && !isSelected ? 'text-blue-600 ring-2 ring-blue-100' : ''}
                      `}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Time Selector Slot */}
        <button 
          onClick={() => {
            setActivePicker(activePicker === 'time' ? null : 'time');
            setTimeMode('hour');
          }}
          className={`flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all duration-300 text-left ${
            activePicker === 'time' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 bg-white hover:border-slate-200'
          }`}
        >
          <div className={`w-14 h-14 flex items-center justify-center text-2xl rounded-2xl transition-all ${details.time ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <i className="ph-fill ph-clock"></i>
          </div>
          <div className="flex-1">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Start Time</span>
            <span className={`text-lg font-black tracking-tight ${details.time ? 'text-slate-900' : 'text-slate-300 italic'}`}>
              {formattedTime || 'Select Time'}
            </span>
          </div>
          <i className={`ph-bold ph-caret-down text-slate-300 transition-transform duration-300 ${activePicker === 'time' ? 'rotate-180' : ''}`}></i>
        </button>

        {/* Time Picker Content */}
        {activePicker === 'time' && (
          <div className="bg-slate-900 rounded-[3rem] p-8 shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 duration-300">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-4 mb-8">
                <button 
                  onClick={() => setTimeMode('hour')}
                  className={`text-4xl font-black tracking-tighter transition-all ${timeMode === 'hour' ? 'text-white scale-110' : 'text-slate-600'}`}
                >
                  {currentHour.toString().padStart(2, '0')}
                </button>
                <span className="text-4xl font-black text-slate-700">:</span>
                <button 
                  onClick={() => setTimeMode('minute')}
                  className={`text-4xl font-black tracking-tighter transition-all ${timeMode === 'minute' ? 'text-white scale-110' : 'text-slate-600'}`}
                >
                  {currentMinute.toString().padStart(2, '0')}
                </button>
                <div className="flex flex-col gap-2 ml-4">
                  <button onClick={() => togglePeriod('AM')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${period === 'AM' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-500'}`}>AM</button>
                  <button onClick={() => togglePeriod('PM')} className={`text-[10px] font-black px-3 py-1.5 rounded-lg border transition-all ${period === 'PM' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-700 text-slate-500'}`}>PM</button>
                </div>
              </div>

              {/* Analog Clock Face */}
              <div className="relative w-56 h-56 rounded-full bg-slate-800/50 border-4 border-slate-800 flex items-center justify-center">
                <div className="absolute w-2 h-2 bg-blue-500 rounded-full z-20"></div>
                <div 
                  className="absolute bottom-1/2 left-1/2 w-1 bg-blue-500 origin-bottom transition-all duration-500 ease-out z-10"
                  style={{ 
                    height: timeMode === 'hour' ? '60px' : '80px',
                    transform: `translateX(-50%) rotate(${timeMode === 'hour' ? (currentHour * 30) : (currentMinute * 6)}deg)`
                  }}
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                </div>

                {(timeMode === 'hour' ? hours : minutes).map((val, i) => {
                  const angle = (i * 30) - 90;
                  const rad = (angle * Math.PI) / 180;
                  const dist = timeMode === 'hour' ? 80 : 85;
                  const x = Math.cos(rad) * dist;
                  const y = Math.sin(rad) * dist;
                  const isActive = timeMode === 'hour' ? currentHour === val : currentMinute === val;
                  
                  return (
                    <button
                      key={val}
                      onClick={() => setClockTime(val, timeMode)}
                      className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all transform hover:scale-125
                        ${isActive ? 'text-white scale-110' : 'text-slate-500'}
                      `}
                      style={{ left: `calc(50% + ${x}px - 16px)`, top: `calc(50% + ${y}px - 16px)` }}
                    >
                      {timeMode === 'minute' ? val.toString().padStart(2, '0') : val}
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] text-center">
                Select {timeMode} to continue
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 bg-blue-50 border border-blue-100 rounded-[2.5rem] flex items-start gap-4">
         <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl flex-shrink-0">
           <i className="ph-fill ph-info"></i>
         </div>
         <p className="text-[11px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
           Movers arrive within a 1-hour window of your chosen time. We'll call 30 mins prior to arrival.
         </p>
      </div>
    </div>
  );
};

export default Step4Schedule;
