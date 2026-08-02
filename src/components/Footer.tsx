'use client';

import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-12 py-8 pb-20 sm:pb-8 text-center text-xs text-slate-500 space-y-3">
      <div className="font-semibold text-slate-700">
        Powered by Malik Enterprises
      </div>

      <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-medium">
        <a
          href="https://wa.me/917078523738?text=Hi%20Malik%20Enterprises!"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-slate-800 transition-colors font-semibold text-[#043d27]"
        >
          Contact Us via WhatsApp
        </a>
        <span>•</span>
        <a
          href="/admin"
          className="hover:text-slate-900 transition-colors font-semibold text-slate-600 flex items-center gap-1"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
          <span>Admin Portal</span>
        </a>
      </div>
    </footer>
  );
};
