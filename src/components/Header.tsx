'use client';

import React, { useState } from 'react';
import {
  Menu,
  Search,
  X,
  Tag,
  ShieldCheck,
  PhoneCall,
  Settings,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Store,
  LayoutGrid,
  Receipt,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { ActiveTab } from '@/types/product';

interface HeaderProps {
  categories?: string[];
  activeTab?: ActiveTab;
  onTabSelect?: (tab: ActiveTab) => void;
  onSearchClick?: () => void;
  onCategorySelect?: (category: string) => void;
  onOpenOwnerModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  categories = ['All', 'Furniture', 'Electronics', 'Accessories'],
  activeTab = 'shop',
  onTabSelect,
  onSearchClick,
  onCategorySelect,
  onOpenOwnerModal,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDrawerClosing, setIsDrawerClosing] = useState(false);
  const { openCart, totalItemsCount } = useCart();
  const { currentUser, userData, isAdmin, openAuthModal, logOut } = useAuth();

  const closeNavDrawer = () => {
    setIsDrawerClosing(true);
    setTimeout(() => {
      setIsDrawerClosing(false);
      setDrawerOpen(false);
    }, 240);
  };

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
          <button
            onClick={() => {
              if (onTabSelect) onTabSelect('shop');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="font-bold text-lg text-slate-900 tracking-tight text-center hover:opacity-80 transition-opacity"
          >
            Malik Enterprises
          </button>

          {/* Right: Search, Cart, Admin & Account Icons */}
          <div className="flex items-center gap-1 -mr-2">
            <button
              onClick={onSearchClick}
              className="p-2 text-slate-800 hover:text-slate-900 transition-colors"
              title="Search Catalog"
            >
              <Search className="w-5 h-5 stroke-[2]" />
            </button>

            {/* SHOPPING CART BUTTON WITH BADGE */}
            <button
              onClick={openCart}
              className="p-2 text-slate-800 hover:text-slate-900 transition-colors relative"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5 stroke-[2]" />
              {totalItemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-[#043d27] text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItemsCount}
                </span>
              )}
            </button>

            {/* DEDICATED ADMIN PORTAL LINK */}
            <a
              href="/admin"
              className="p-2 text-[#043d27] hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1"
              title="Admin Portal"
            >
              <ShieldCheck className="w-5 h-5 stroke-[2]" />
              <span className="hidden lg:inline text-xs font-bold">Admin</span>
            </a>

            {/* CUSTOMER SIGN IN / PROFILE BUTTON */}
            {currentUser ? (
              <button
                onClick={() => {
                  if (onTabSelect) onTabSelect('account');
                  scrollToCatalog();
                }}
                className="flex items-center gap-1.5 ml-1 px-2.5 py-1 rounded-full bg-emerald-50 text-[#043d27] border border-emerald-200 font-bold text-xs hover:bg-emerald-100 transition-colors"
                title="Account Settings"
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span className="max-w-[90px] truncate">
                  {userData?.name?.split(' ')[0] || currentUser.email?.split('@')[0] || 'Account'}
                </span>
              </button>
            ) : (
              <button
                onClick={() => openAuthModal('signin')}
                className="ml-1 px-3 py-1.5 rounded-lg bg-[#043d27] text-white font-bold text-xs hover:bg-[#002b1b] transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>


      {/* Slide-out Mobile Navigation Drawer */}
      {(drawerOpen || isDrawerClosing) && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className={`fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ${
              isDrawerClosing ? 'opacity-0' : 'animate-fadeIn'
            }`}
            onClick={closeNavDrawer}
          />

          <div
            className={`relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col justify-between p-6 z-10 overflow-y-auto ${
              isDrawerClosing ? 'animate-slideFromLeftOut' : 'animate-slideFromLeft'
            }`}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="font-bold text-base text-slate-900">Navigation</span>
                <button
                  onClick={closeNavDrawer}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* MAIN STORE SECTIONS */}
              <div className="space-y-2 text-xs font-bold">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">
                  Main Views
                </div>
                <button
                  onClick={() => {
                    if (onTabSelect) onTabSelect('shop');
                    closeNavDrawer();
                    scrollToCatalog();
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2.5 transition-colors ${
                    activeTab === 'shop'
                      ? 'bg-[#043d27] text-white'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>Store Catalog</span>
                </button>

                <button
                  onClick={() => {
                    if (onTabSelect) onTabSelect('categories');
                    closeNavDrawer();
                    scrollToCatalog();
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2.5 transition-colors ${
                    activeTab === 'categories'
                      ? 'bg-[#043d27] text-white'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Categories</span>
                </button>

                <button
                  onClick={() => {
                    if (onTabSelect) onTabSelect('orders');
                    closeNavDrawer();
                    scrollToCatalog();
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2.5 transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-[#043d27] text-white'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  <span>My Orders</span>
                </button>

                <button
                  onClick={() => {
                    if (currentUser) {
                      if (onTabSelect) onTabSelect('account');
                    } else {
                      openAuthModal('signin');
                    }
                    closeNavDrawer();
                    scrollToCatalog();
                  }}
                  className={`w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2.5 transition-colors ${
                    activeTab === 'account'
                      ? 'bg-[#043d27] text-white'
                      : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span>{currentUser ? 'My Profile' : 'Sign In with Email'}</span>
                </button>

                <a
                  href="/admin"
                  className="w-full text-left py-2.5 px-3 rounded-lg flex items-center gap-2.5 bg-emerald-50 text-[#043d27] font-bold transition-colors border border-emerald-200"
                >
                  <ShieldCheck className="w-4 h-4 text-[#043d27]" />
                  <span>Admin Portal</span>
                </a>
              </div>

              {/* DYNAMIC CATEGORIES LIST */}
              <div className="space-y-2 text-xs pt-4 border-t border-slate-100">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Quick Category Filter
                </div>

                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      if (onCategorySelect) onCategorySelect(cat);
                      if (onTabSelect) onTabSelect('shop');
                      closeNavDrawer();
                      scrollToCatalog();
                    }}
                    className="w-full text-left py-1.5 px-2 font-medium text-slate-700 hover:text-emerald-700 flex items-center gap-2"
                  >
                    <Tag className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{cat === 'All' ? 'All Catalog Items' : cat}</span>
                  </button>
                ))}
              </div>

              {/* OWNER INVENTORY MANAGEMENT */}
              <div className="pt-4 border-t border-slate-100 space-y-2">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Owner Tools
                </div>
                <button
                  onClick={() => {
                    if (onOpenOwnerModal) onOpenOwnerModal();
                    closeNavDrawer();
                  }}
                  className="w-full text-left py-2.5 px-3 rounded-lg bg-emerald-50 text-[#043d27] font-bold text-xs flex items-center gap-2 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                >
                  <Settings className="w-4 h-4 text-[#043d27]" />
                  <span>Manage Catalog / Add Product</span>
                </button>
              </div>

              {currentUser && (
                <button
                  onClick={() => {
                    logOut();
                    closeNavDrawer();
                  }}
                  className="w-full py-2.5 px-3 rounded-lg bg-red-50 text-red-700 font-bold text-xs flex items-center justify-center gap-2 border border-red-200 hover:bg-red-100 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>

            <div className="pt-6 border-t border-slate-100 space-y-3 mt-6">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Quality Guarantee</span>
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
