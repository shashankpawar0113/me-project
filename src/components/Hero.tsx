'use client';

import React from 'react';

export const Hero: React.FC = () => {
  return (
    <div className="relative bg-gradient-to-b from-slate-100/90 via-slate-50 to-white px-4 py-8 sm:py-12 border-b border-slate-200/80 text-center">
      {/* Background subtle image overlay texture */}
      <div 
        className="absolute inset-0 opacity-10 mix-blend-multiply bg-cover bg-center pointer-events-none"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=1200&q=80')`
        }}
      />

      <div className="relative max-w-xl mx-auto space-y-3">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight leading-tight">
          Quality Refurbished Goods, Unbeatable Prices
        </h2>
        
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal px-2">
          Shop chairs, electronics, and accessories at unbeatable prices with direct WhatsApp delivery.
        </p>
      </div>
    </div>
  );
};
