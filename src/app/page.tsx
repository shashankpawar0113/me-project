'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { useAuth } from '@/context/AuthContext';
import { useCart, OrderRecord } from '@/context/CartContext';
import { Product, ActiveTab } from '@/types/product';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Header } from '@/components/Header';
import { ScrollHero } from '@/components/ScrollHero';
import { ProductCard } from '@/components/ProductCard';
import { ProductModal } from '@/components/ProductModal';
import { OwnerInventoryModal } from '@/components/OwnerInventoryModal';
import { AuthModal } from '@/components/AuthModal';
import { CartDrawer } from '@/components/CartDrawer';
import { BottomNav } from '@/components/BottomNav';
import { Footer } from '@/components/Footer';
import {
  Search,
  X,
  MessageCircle,
  ShoppingBag,
  ShieldCheck,
  Settings,
  User as UserIcon,
  LogOut,
  Clock,
  CheckCircle,
  Package,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Lock,
} from 'lucide-react';

export default function StorefrontPage() {
  const { products } = useInventory();
  const { currentUser, userData, openAuthModal, logOut } = useAuth();
  const { orders, loadingOrders } = useCart();

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Modal State
  const [ownerModalOpen, setOwnerModalOpen] = useState(false);

  // Search & Navigation States
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<ActiveTab>('shop');
  const [emailSearchedOrders, setEmailSearchedOrders] = useState<OrderRecord[]>([]);

  // Search orders in Firestore in real-time when typing in search bar
  useEffect(() => {
    const trimmed = searchQuery.trim().toLowerCase();
    if (!trimmed) {
      setEmailSearchedOrders([]);
      return;
    }
    const globalRef = collection(db, 'orders');
    const unsubscribe = onSnapshot(
      globalRef,
      (snap) => {
        const rawList: OrderRecord[] = [];
        snap.forEach((d) => {
          const data = d.data() as OrderRecord;
          const targetId = data.id || d.id;
          rawList.push({ ...data, id: targetId });
        });

        // Merge duplicate/partial documents by order ID
        const map = new Map<string, OrderRecord>();
        rawList.forEach((r) => {
          const key = r.id;
          const existing = map.get(key);
          if (!existing) {
            map.set(key, { ...r });
          } else {
            map.set(key, {
              id: key,
              userId: r.userId || existing.userId,
              items: r.items && r.items.length > 0 ? r.items : existing.items,
              totalAmount: r.totalAmount || existing.totalAmount,
              status: r.status || existing.status,
              shippingAddress: r.shippingAddress || existing.shippingAddress,
              phone: r.phone || existing.phone,
              email: r.email || existing.email,
              createdAt: r.createdAt && !isNaN(new Date(r.createdAt).getTime()) ? r.createdAt : existing.createdAt,
              whatsappUrl: r.whatsappUrl || existing.whatsappUrl,
            });
          }
        });

        const filtered = Array.from(map.values()).filter((o) => {
          const itemTitles = o.items?.map((i) => i.product.title).join(' ') || '';
          const searchable = `${o.id || ''} ${o.email || ''} ${o.phone || ''} ${o.shippingAddress || ''} ${itemTitles}`.toLowerCase();
          return searchable.includes(trimmed);
        });

        filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        setEmailSearchedOrders(filtered);
      },
      (err) => {
        console.warn('Realtime email order lookup error:', err);
      }
    );
    return () => unsubscribe();
  }, [searchQuery]);

  // Compute display orders: if signed out and no search query, display empty list
  const displayOrders = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const combined = [...emailSearchedOrders, ...orders];
      const map = new Map<string, OrderRecord>();
      combined.forEach((o) => {
        const existing = map.get(o.id);
        if (!existing) {
          map.set(o.id, { ...o });
        } else {
          map.set(o.id, {
            id: o.id,
            userId: o.userId || existing.userId,
            items: o.items && o.items.length > 0 ? o.items : existing.items,
            totalAmount: o.totalAmount || existing.totalAmount,
            status: o.status || existing.status,
            shippingAddress: o.shippingAddress || existing.shippingAddress,
            phone: o.phone || existing.phone,
            email: o.email || existing.email,
            createdAt: o.createdAt && !isNaN(new Date(o.createdAt).getTime()) ? o.createdAt : existing.createdAt,
            whatsappUrl: o.whatsappUrl || existing.whatsappUrl,
          });
        }
      });

      return Array.from(map.values()).filter((o) => {
        const itemTitles = o.items?.map((i) => i.product.title).join(' ') || '';
        const searchable = `${o.id || ''} ${o.email || ''} ${o.phone || ''} ${o.shippingAddress || ''} ${itemTitles}`.toLowerCase();
        return searchable.includes(q);
      });
    }
    if (!currentUser) return [];
    return orders;
  }, [orders, emailSearchedOrders, searchQuery, currentUser]);

  // Dynamic Categories list
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
      {/* HEADER WITH DYNAMIC CATEGORIES & CART/AUTH BUTTONS */}
      <Header
        categories={categories}
        activeTab={activeTab}
        onTabSelect={(tab) => {
          setActiveTab(tab);
          const el = document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
        onSearchClick={() => setSearchOpen((prev) => !prev)}
        onCategorySelect={(cat) => {
          setSelectedCategory(cat);
          setActiveTab('shop');
          const el = document.getElementById('catalog');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
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

      {/* CATEGORY FILTER PILLS */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 overflow-x-auto">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setActiveTab('shop');
                }}
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

      {/* MAIN CONTENT AREA */}
      <main id="catalog" className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 scroll-mt-14">

        {/* SHOP TAB VIEW */}
        {activeTab === 'shop' && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
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
          <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-w-md mx-auto my-4 shadow-xs">
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
                  className="p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left font-bold text-xs text-slate-800 flex items-center justify-between border border-slate-200"
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
          <div className="max-w-2xl mx-auto space-y-4 my-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-[#043d27]" />
                    <span>Live Order Status Tracking</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {currentUser
                      ? `Signed in as ${currentUser.email}. Showing your linked orders.`
                      : 'View your past orders or search by Order ID, Email, or Phone below.'}
                  </p>
                </div>

                {!currentUser && (
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="px-3.5 py-1.5 bg-[#043d27] text-white text-xs font-bold rounded-lg hover:bg-[#002b1b] transition-colors shrink-0 flex items-center justify-center gap-1.5"
                  >
                    <UserIcon className="w-3.5 h-3.5" />
                    <span>Sign In to Track</span>
                  </button>
                )}
              </div>

              {/* INSTANT MULTI-FIELD ORDER LOOKUP */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Track Order & Search History
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by Order ID, Email, Phone Number, or Item..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
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

              {loadingOrders ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#043d27] border-t-transparent mb-2" />
                  <p className="text-xs text-slate-500">Loading your orders...</p>
                </div>
              ) : displayOrders.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-lg border border-slate-200 p-6 space-y-3">
                  <ShoppingBag className="w-8 h-8 text-slate-400 mx-auto" />
                  <h3 className="font-bold text-slate-900 text-sm">
                    {!currentUser && !searchQuery.trim()
                      ? 'Please Sign In to View Your Orders'
                      : searchQuery.trim()
                      ? `No Orders Found for "${searchQuery.trim()}"`
                      : 'No Orders Found'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    {!currentUser && !searchQuery.trim()
                      ? 'Sign in with your email or enter your Order ID, email, or phone number above to track your order.'
                      : searchQuery.trim()
                      ? `We couldn't find any orders matching "${searchQuery.trim()}". Check the Order ID, email, or phone number and try again.`
                      : 'Items added to cart and checked out via WhatsApp will appear here with live status updates.'}
                  </p>
                  {!currentUser && !searchQuery.trim() ? (
                    <button
                      onClick={() => openAuthModal('signin')}
                      className="px-5 py-2.5 bg-[#043d27] text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      Sign In Now
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveTab('shop')}
                      className="px-5 py-2.5 bg-[#043d27] text-white text-xs font-bold rounded-lg shadow-xs"
                    >
                      Explore Catalog
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {displayOrders.map((order) => (
                    <div
                      key={order.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                        <div>
                          <div className="text-xs font-bold text-slate-900 font-mono flex items-center gap-2">
                            <span>Order #{order.id.slice(0, 12)}</span>
                            {order.email && (
                              <span className="text-[10px] font-sans font-medium text-slate-500 bg-slate-200/60 px-1.5 py-0.5 rounded">
                                {order.email}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>
                              {order.createdAt && !isNaN(new Date(order.createdAt).getTime())
                                ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : 'Recent Order'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : order.status === 'Dispatched'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : order.status === 'Confirmed'
                            ? 'bg-indigo-100 text-indigo-800 border-indigo-300'
                            : order.status === 'Cancelled'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}>
                          <CheckCircle className="w-3 h-3" />
                          <span>{order.status || 'Processing'}</span>
                        </span>
                      </div>

                      {/* ITEMS IN THIS ORDER */}
                      <div className="space-y-2">
                        {order.items?.map(({ product, quantity }) => (
                          <div key={product.id} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <img
                                src={product.images[0] || 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=200&q=80'}
                                alt=""
                                className="w-8 h-8 rounded object-cover bg-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-800">{product.title}</span>
                                <span className="text-slate-500 ml-2">x{quantity}</span>
                              </div>
                            </div>
                            <span className="font-bold text-slate-900">
                              ₹{(product.sellingPrice * quantity).toLocaleString('en-IN')}
                            </span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <div className="text-slate-600 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{order.shippingAddress || 'Direct Delivery'}</span>
                        </div>
                        <div className="font-black text-sm text-[#043d27]">
                          Total: ₹{(order.totalAmount || (order.items?.reduce((s, i) => s + (i.product.sellingPrice * i.quantity), 0)) || 0).toLocaleString('en-IN')}
                        </div>
                      </div>

                      {order.whatsappUrl && (
                        <a
                          href={order.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-[#043d27] rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-200 transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-current" />
                          <span>Re-open Order Chat on WhatsApp</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* CUSTOMER ACCOUNT TAB VIEW */}
        {activeTab === 'account' && (
          <div className="max-w-md mx-auto my-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-5 shadow-xs">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-full bg-[#043d27] text-white flex items-center justify-center font-bold text-lg">
                  {currentUser ? (userData?.name?.[0] || currentUser.email?.[0] || 'U').toUpperCase() : <UserIcon className="w-6 h-6" />}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">
                    {currentUser ? (userData?.name || currentUser.displayName || 'Valued Customer') : 'Guest Customer'}
                  </div>
                  <div className="text-xs text-slate-500">
                    {currentUser ? currentUser.email : 'Sign in to sync your order history'}
                  </div>
                </div>
              </div>

              {currentUser ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                    <div className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Account Information
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{userData?.email || currentUser.email}</span>
                    </div>
                    {userData?.phone && (
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{userData.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>
                        Member since{' '}
                        {userData?.createdAt
                          ? new Date(userData.createdAt).toLocaleDateString('en-IN')
                          : 'Recently'}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveTab('orders')}
                    className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 text-[#043d27] font-bold text-xs rounded-lg flex items-center justify-center gap-2 border border-emerald-200 transition-colors"
                  >
                    <Package className="w-4 h-4" />
                    <span>Track Order Statuses</span>
                  </button>

                  <button
                    onClick={() => logOut()}
                    className="w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-lg flex items-center justify-center gap-2 border border-red-200 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sign in with your email address to automatically save your cart, track live delivery status, and view past dispatches.
                  </p>
                  <button
                    onClick={() => openAuthModal('signin')}
                    className="w-full py-3 bg-[#043d27] hover:bg-[#002b1b] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-xs transition-colors"
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Sign In / Create Account with Email</span>
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="font-bold text-[10px] uppercase tracking-wider text-slate-400">
                  Staff & Admin Portal
                </div>

                <a
                  href="/admin"
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-[#043d27]" />
                  <span>Admin & Staff Login Portal</span>
                </a>

                <a
                  href="https://wa.me/917078523738?text=Hi%20Malik%20Enterprises!"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-lg flex items-center justify-center gap-2 border border-slate-200 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700 fill-current" />
                  <span>Contact Owner on WhatsApp</span>
                </a>
              </div>
            </div>
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

      {/* AUTHENTICATION MODAL */}
      <AuthModal />

      {/* SHOPPING CART DRAWER */}
      <CartDrawer />

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
