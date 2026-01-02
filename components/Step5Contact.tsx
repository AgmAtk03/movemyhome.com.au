
import React from 'react';
import { MoveDetails } from '../types';

interface Step5Props {
  details: MoveDetails;
  onUpdateDetails: (d: Partial<MoveDetails>) => void;
}

const Step5Contact: React.FC<Step5Props> = ({ details, onUpdateDetails }) => {
  return (
    <div className="space-y-8 animate-premium-in pb-10">
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Step 5: Contact Info</h2>
        <p className="text-slate-500 text-sm font-medium">Please provide your details to secure your booking.</p>
      </div>

      <div className="space-y-5 px-1">
        <div className="space-y-4">
          {/* Name Field */}
          <div className="space-y-1.5 group">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-blue-500 transition-colors">Full Name</label>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">Required</span>
            </div>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <i className="ph-bold ph-user text-xl"></i>
              </div>
              <input 
                type="text" 
                placeholder="e.g. John Doe"
                className="w-full pl-14 p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                value={details.name}
                onChange={(e) => onUpdateDetails({ name: e.target.value })}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="space-y-1.5 group">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-blue-500 transition-colors">Email Address</label>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">Required</span>
            </div>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <i className="ph-bold ph-envelope-simple text-xl"></i>
              </div>
              <input 
                type="email" 
                placeholder="e.g. john@example.com"
                className="w-full pl-14 p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                value={details.email}
                onChange={(e) => onUpdateDetails({ email: e.target.value })}
              />
            </div>
          </div>

          {/* Phone Field */}
          <div className="space-y-1.5 group">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-focus-within:text-blue-500 transition-colors">Mobile Number</label>
              <span className="text-[9px] font-black text-blue-500 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded-md">Required</span>
            </div>
            <div className="relative">
              <div className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-slate-300 group-focus-within:text-blue-500 transition-colors">
                <i className="ph-bold ph-phone text-xl"></i>
              </div>
              <input 
                type="tel" 
                placeholder="e.g. 0400 000 000"
                className="w-full pl-14 p-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300"
                value={details.phone}
                onChange={(e) => onUpdateDetails({ phone: e.target.value })}
              />
            </div>
          </div>

          {/* Instructions Field */}
          <div className="space-y-2 group pt-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 group-focus-within:text-blue-500 transition-colors">Special Instructions (Optional)</label>
             <textarea 
              placeholder="e.g. Extra heavy items, parking restrictions, building access codes..."
              rows={4}
              className="w-full p-5 bg-white border border-slate-100 rounded-3xl text-sm font-medium text-slate-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none shadow-sm placeholder:text-slate-300"
              value={details.instructions}
              onChange={(e) => onUpdateDetails({ instructions: e.target.value })}
            />
          </div>
        </div>
      </div>

      <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-start gap-5 shadow-sm">
        <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-lg shadow-emerald-500/20">
          <i className="ph-fill ph-shield-check"></i>
        </div>
        <div>
          <h4 className="font-black text-emerald-900 text-sm uppercase tracking-tight">Safe & Secured</h4>
          <p className="text-emerald-700 text-[11px] leading-relaxed font-bold mt-1 uppercase opacity-80">
            Booking details are encrypted. Our team will call you to confirm the time slot and logistics once you click "Book Now".
          </p>
        </div>
      </div>
    </div>
  );
};

export default Step5Contact;
