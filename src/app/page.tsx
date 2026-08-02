'use client';

import React, { useState, useMemo } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { Product, ActiveTab } from '@/types/product';
import { Header } from '@/components/Header';
import { ScrollHero } from '@/components/ScrollHero';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { OwnerInventoryModal } from '@/components/OwnerInventoryModal';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import { Search, X, MessageCircle, ShoppingBag, ShieldCheck, Settings, Plus } from 'lucide-react';

export default function StorefrontPage() {
  const { products } = useInventory();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal State
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  // Search & Navigation States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<ActiveTab>('shop');

  // Dynamic Categories list (extracts all categories including custom owner categories)
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f9f9ff]">
      {/* HEADER WITH DYNAMIC CATEGORIES */}
      <Header
        categories={categories}
        onSearchClick={() => setSearchOpen((prev) => !prev)}
        onCategorySelect={(cat) => setSelectedCategory(cat)}
        onOpenOwnerModal={() => setOwnerModalOpen(true)}
      />

      {/* FULL-SCREEN SCROLL CANVAS HERO ANIMATION */}
      <ScrollHero />

      {/* EXPANDABLE SEARCH BAR */}
      {searchOpen && (
        <div className="bg-white border-b border-slate-200 p-3 animate-fadeIn">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              placeholder="Search chairs, monitors, desks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-slate-50 rounded border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* CATEGORY FILTER PILLS & OWNER QUICK ADD BUTTON */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-[#043d27] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MAIN PRODUCT GRID */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'shop' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onOpenModal={(p) => setSelectedProduct(p)}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-4 max-w-md mx-auto my-6 shadow-xs">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-[#043d27] border border-emerald-200 flex items-center justify-center mx-auto">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-base">
                    {products.length === 0 ? 'New Stock Arriving Soon' : 'No Items Found'}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {products.length === 0
                      ? 'New refurbished items are added regularly. Reach out on WhatsApp for availability and custom inquiries.'
                      : 'No items match your active search or category filters.'}
                  </p>
                </div>
                {products.length === 0 ? (
                  <a
                    href="https://wa.me/917078523738?text=Hi%20Malik%20Enterprises!"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-[#043d27] text-white text-xs font-bold rounded-lg shadow-xs inline-flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Inquire via WhatsApp</span>
                  </a>
                ) : (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                    }}
                    className="px-4 py-2 bg-[#043d27] text-white text-xs font-bold rounded"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {/* CATEGORIES TAB VIEW */}
        {activeTab === 'categories' && (
          <div className="bg-white rounded border border-slate-200 p-6 space-y-4 max-w-md mx-auto my-4">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">
              Browse Categories
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {categories.filter((c) => c !== 'All').map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setActiveTab('shop');
                  }}
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded text-left font-bold text-xs text-slate-800 flex items-center justify-between border border-slate-200"
                >
                  <span>{cat}</span>
                  <span className="text-[#043d27] text-xs font-bold">View Items →</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ORDERS TAB VIEW */}
        {activeTab === 'orders' && (
          <div className="bg-white rounded border border-slate-200 p-6 space-y-3 max-w-md mx-auto my-4 text-center">
            <ShoppingBag className="w-10 h-10 text-[#043d27] mx-auto" />
            <h3 className="font-bold text-slate-900 text-base">Direct WhatsApp Orders</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              All orders are placed directly with Malik Enterprises via WhatsApp (+91 70785 23738). 
              Check your WhatsApp chat history for live order updates & delivery tracking.
            </p>
          </div>
        )}

        {/* ACCOUNT TAB VIEW */}
        {activeTab === 'account' && (
          <div className="bg-white rounded border border-slate-200 p-6 space-y-4 max-w-md mx-auto my-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <ShieldCheck className="w-8 h-8 text-[#043d27]" />
              <div>
                <div className="font-bold text-slate-900 text-sm">Malik Enterprises Support</div>
                <div className="text-xs text-slate-500">Official Direct Customer Portal</div>
              </div>
            </div>

            <button
              onClick={() => setOwnerModalOpen(true)}
              className="w-full py-3 bg-[#043d27] text-white font-bold text-xs rounded flex items-center justify-center gap-2 shadow-xs"
            >
              <Settings className="w-4 h-4" />
              <span>Open Owner Inventory Manager</span>
            </button>

            <a
              href="https://wa.me/917078523738?text=Hi%20Malik%20Enterprises!"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded flex items-center justify-center gap-2 border border-slate-200"
            >
              <MessageCircle className="w-4 h-4 fill-current" />
              <span>Contact Owner on WhatsApp</span>
            </a>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <Footer />

      {/* FIXED MOBILE BOTTOM NAVIGATION BAR */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab === 'shop') setSelectedCategory('All');
        }}
      />

      {/* PRODUCT DETAIL MODAL */}
      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* OWNER INVENTORY MANAGEMENT MODAL */}
      <OwnerInventoryModal
        isOpen={ownerModalOpen}
        onClose={() => setOwnerModalOpen(false)}
      />
    </div>
  );
}
