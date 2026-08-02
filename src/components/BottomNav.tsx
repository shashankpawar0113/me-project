'use client';

import React from 'react';
import { Store, LayoutGrid, Receipt, User } from 'lucide-react';
import { ActiveTab } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { currentUser } = useAuth();
  const { orders } = useCart();

  const tabs = [
    { id: 'shop' as ActiveTab, label: 'Shop', icon: Store },
    { id: 'categories' as ActiveTab, label: 'Categories', icon: LayoutGrid },
    { id: 'orders' as ActiveTab, label: 'Orders', icon: Receipt, badge: orders.length > 0 ? orders.length : undefined },
    { id: 'account' as ActiveTab, label: currentUser ? 'Profile' : 'Sign In', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-1.5 px-4 sm:hidden shadow-lg">
      <div className="flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                onTabChange(tab.id);
                const el = document.getElementById('catalog');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded transition-colors relative ${

                isActive ? 'text-[#043d27]' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 bg-[#043d27] text-white text-[9px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
