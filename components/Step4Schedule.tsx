
import React, { useState, useMemo } from 'react';
import { MoveDetails } from '../types';

interface Step4Props {
  details: MoveDetails;
  onUpdateDetails: (d: Partial<MoveDetails>) => void;
  showValidation?: boolean;
}

const Step4Schedule: React.FC<Step4Props> = ({ details, onUpdateDetails, showValidation = false }) => {
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

  const formattedDate = useMemo(() => {
    if (!details.date) return null;
    return new Date(`${details.date}T00:00:00`).toLocaleDateString('en-AU', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }, [details.date]);

  const formattedTime = useMemo(() => {
    if (!details.time) return null;
    const [h, m] = details.time.split(':').map(Number);
    const displayH = h % 12 || 12;
    const displayP = h >= 12 ? 'pm' : 'am';
    return `${displayH}:${m.toString().padStart(2, '0')} ${displayP}`;
  }, [details.time]);

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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onUpdateDetails({ date: `${year}-${month}-${day}` });
    setActivePicker(null);
  };

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
    let [h, m] = (details.time || '09:00').split(':').map(Number);

    if (type === 'hour') {
      let newH = val === 12 ? 0 : val;
      if (period === 'PM') newH += 12;
      h = newH;
      setTimeMode('minute');
    } else {
      m = val;
      setActivePicker(null);
    }

    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onUpdateDetails({ time: timeString });
  };

  const togglePeriod = (p: 'AM' | 'PM') => {
    setPeriod(p);
    let [h, m] = (details.time || '09:00').split(':').map(Number);
    h = h % 12;
    if (p === 'PM') h += 12;
    const timeString = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onUpdateDetails({ time: timeString });
  };

  const missingDate = showValidation && !details.date;
  const missingTime = showValidation && !details.time;

  return (
    <div className="space-y-6 animate-premium-in pb-10">
      <div className="space-y-2">
        <h2 tabIndex={-1} className="text-2xl font-black text-slate-900 tracking-tight outline-none">
          When should we arrive?
        </h2>
        <p className="text-slate-500 text-base font-medium leading-relaxed">
          Choose a day and a start time. We’ll work to a one-hour window around that.
        </p>
      </div>

      {(missingDate || missingTime) && (
        <p className="text-sm text-rose-700 bg-rose-50 border border-rose-100 rounded-2xl p-4" role="alert">
          Please pick both a date and a time so we know when to show up.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4">
        <button
          type="button"
          onClick={() => setActivePicker(activePicker === 'date' ? null : 'date')}
          aria-expanded={activePicker === 'date'}
          className={`flex items-center gap-5 p-5 min-h-[5.5rem] rounded-[1.75rem] border-2 text-left ${
            missingDate ? 'border-rose-400 bg-rose-50' : activePicker === 'date' ? 'border-blue-600 bg-blue-50/50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className={`w-14 h-14 flex items-center justify-center text-2xl rounded-2xl ${details.date ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <i className="ph-fill ph-calendar" aria-hidden="true"></i>
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-0.5">Move date</span>
            <span className={`text-lg font-black tracking-tight ${details.date ? 'text-slate-900' : 'text-slate-400'}`}>
              {formattedDate || 'Choose a day'}
            </span>
          </div>
        </button>

        {activePicker === 'date' && (
          <div className="bg-white border-2 border-slate-100 rounded-[2rem] overflow-hidden">
            <div className="bg-blue-600 p-4 flex justify-between items-center text-white">
              <button type="button" onClick={() => changeMonth(-1)} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/20" aria-label="Previous month">
                <i className="ph-bold ph-caret-left" aria-hidden="true"></i>
              </button>
              <h3 className="font-black text-sm tracking-tight">
                {viewDate.toLocaleString('en-AU', { month: 'long', year: 'numeric' })}
              </h3>
              <button type="button" onClick={() => changeMonth(1)} className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-white/20" aria-label="Next month">
                <i className="ph-bold ph-caret-right" aria-hidden="true"></i>
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                  <div key={i} className="text-center text-[11px] font-bold text-slate-400 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((date, i) => {
                  if (!date) return <div key={i} />;
                  const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
                  const isToday = date.getTime() === today.getTime();
                  const isSelected = details.date === iso;
                  const isPast = date < today;
                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={isPast}
                      onClick={() => handleDateSelect(date)}
                      className={`h-11 rounded-xl text-sm font-bold ${
                        isSelected ? 'bg-blue-600 text-white' : isPast ? 'text-slate-300 cursor-not-allowed' : 'text-slate-700 hover:bg-blue-50'
                      } ${isToday && !isSelected ? 'text-blue-700 ring-2 ring-blue-100' : ''}`}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            setActivePicker(activePicker === 'time' ? null : 'time');
            setTimeMode('hour');
          }}
          aria-expanded={activePicker === 'time'}
          className={`flex items-center gap-5 p-5 min-h-[5.5rem] rounded-[1.75rem] border-2 text-left ${
            missingTime ? 'border-rose-400 bg-rose-50' : activePicker === 'time' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-200 bg-white'
          }`}
        >
          <div className={`w-14 h-14 flex items-center justify-center text-2xl rounded-2xl ${details.time ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
            <i className="ph-fill ph-clock" aria-hidden="true"></i>
          </div>
          <div className="flex-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wide block mb-0.5">Arrival window starts</span>
            <span className={`text-lg font-black tracking-tight ${details.time ? 'text-slate-900' : 'text-slate-400'}`}>
              {formattedTime || 'Choose a time'}
            </span>
          </div>
        </button>

        {activePicker === 'time' && (
          <div className="bg-slate-900 rounded-[2.5rem] p-8 relative overflow-hidden">
            <div className="relative z-10 flex flex-col items-center">
              <div className="flex items-center gap-4 mb-8">
                <button type="button" onClick={() => setTimeMode('hour')} className={`text-4xl font-black ${timeMode === 'hour' ? 'text-white' : 'text-slate-500'}`}>
                  {currentHour.toString().padStart(2, '0')}
                </button>
                <span className="text-4xl font-black text-slate-600">:</span>
                <button type="button" onClick={() => setTimeMode('minute')} className={`text-4xl font-black ${timeMode === 'minute' ? 'text-white' : 'text-slate-500'}`}>
                  {currentMinute.toString().padStart(2, '0')}
                </button>
                <div className="flex flex-col gap-2 ml-4">
                  <button type="button" onClick={() => togglePeriod('AM')} className={`min-h-9 text-[11px] font-bold px-3 py-1.5 rounded-lg border ${period === 'AM' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 text-slate-400'}`}>AM</button>
                  <button type="button" onClick={() => togglePeriod('PM')} className={`min-h-9 text-[11px] font-bold px-3 py-1.5 rounded-lg border ${period === 'PM' ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-600 text-slate-400'}`}>PM</button>
                </div>
              </div>

              <div className="relative w-56 h-56 rounded-full bg-slate-800/50 border-4 border-slate-800 flex items-center justify-center">
                <div className="absolute w-2 h-2 bg-blue-500 rounded-full z-20"></div>
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
                      type="button"
                      onClick={() => setClockTime(val, timeMode)}
                      className={`absolute w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${isActive ? 'text-white bg-blue-600' : 'text-slate-400'}`}
                      style={{ left: `calc(50% + ${x}px - 22px)`, top: `calc(50% + ${y}px - 22px)` }}
                    >
                      {timeMode === 'minute' ? val.toString().padStart(2, '0') : val}
                    </button>
                  );
                })}
              </div>
              <p className="mt-6 text-xs font-medium text-slate-400 text-center">
                Tap the {timeMode} to continue
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-5 bg-blue-50 border border-blue-100 rounded-[1.75rem]">
        <p className="text-sm font-medium text-blue-900 leading-relaxed">
          We’ll aim for a one-hour window around your time, and call about 30 minutes before we arrive so you’re not waiting around.
        </p>
      </div>
    </div>
  );
};

export default Step4Schedule;
