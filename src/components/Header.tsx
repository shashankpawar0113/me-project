'use client';

import React, { useState } from 'react';
import { Menu, Search, X, Tag, ShieldCheck, PhoneCall, Settings } from 'lucide-react';

interface HeaderProps {
  categories?: string[];
  onSearchClick?: () => void;
  onCategorySelect?: (category: string) => void;
  onOpenOwnerModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories = ['All', 'Furniture', 'Electronics', 'Accessories'],
  onSearchClick,
  onCategorySelect,
  onOpenOwnerModal,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          {/* Left: Hamburger Menu Icon */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 -ml-2 text-slate-800 hover:text-slate-900 transition-colors"
            title="Open Menu"
          >
            <Menu className="w-6 h-6 stroke-[1.8]" />
          </button>

          {/* Center: Malik Enterprises Brand Title */}
          <h1 className="font-bold text-lg text-slate-900 tracking-tight text-center">
            Malik Enterprises
          </h1>

          {/* Right: Search Icon */}
          <button
            onClick={onSearchClick}
            className="p-2 -mr-2 text-slate-800 hover:text-slate-900 transition-colors"
            title="Search Catalog"
          >
            <Search className="w-5 h-5 stroke-[2]" />
          </button>
        </div>
      </header>

      {/* Slide-out Mobile Navigation Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-base text-slate-900">Navigation</span>
                <button onClick={() => setDrawerOpen(false)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* DYNAMIC CATEGORIES LIST INCLUDING CUSTOM OWNER CATEGORIES */}
              <div className="space-y-3 text-sm">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Product Categories
                </div>

                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (onCategorySelect) onCategorySelect(cat);
                      setDrawerOpen(false);
                    }}
                    className="w-full text-left py-2 font-medium text-slate-800 hover:text-emerald-700 flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>{cat === 'All' ? 'All Catalog Items' : cat}</span>
                  </button>
                ))}
              </div>

              {/* OWNER INVENTORY MANAGEMENT DIRECT ACTION */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Owner Tools
                </div>
                <button
                  onClick={() => {
                    if (onOpenOwnerModal) onOpenOwnerModal();
                    setDrawerOpen(false);
                  }}
                  className="w-full text-left py-2.5 px-3 rounded bg-emerald-50 text-[#043d27] font-bold text-xs flex items-center gap-2 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#043d27]" />
                  <span>Manage Catalog / Add Product</span>
                </button>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Quality Refurbished Guarantee</span>
              </div>
              <a
                href="https://wa.me/917078523738?text=Hi%20Malik%20Enterprises!"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 bg-[#043d27] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>WhatsApp: +91 70785 23738</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
