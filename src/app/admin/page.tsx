'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, ADMIN_EMAIL } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { db } from '@/lib/firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  query,
  orderBy,
  setDoc,
} from 'firebase/firestore';
import { OrderRecord, CartItem } from '@/context/CartContext';
import { Product } from '@/types/product';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Phone,
  MapPin,
  Calendar,
  Search,
  Plus,
  RefreshCw,
  MessageCircle,
  Trash2,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  ArrowLeft,
  DollarSign,
  Package,
  X,
  ChevronDown,
  LogOut,
  AlertCircle,
  Check,
} from 'lucide-react';

export default function AdminPortalPage() {
  const { currentUser, userData, isAdmin, signIn, resetPassword, logOut, loading: authLoading } = useAuth();
  const { products } = useInventory();

  // Admin Login Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Admin Dashboard State
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Create Booking Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [customItemTitle, setCustomItemTitle] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState<number>(1);
  const [bookingStatus, setBookingStatus] = useState<OrderRecord['status']>('Processing');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Fetch all orders across all users from Firestore
  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    try {
      const ordersColRef = collection(db, 'orders');
      const q = query(ordersColRef, orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      const fetched: OrderRecord[] = [];
      snap.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() } as OrderRecord);
      });
      setOrders(fetched);
    } catch (e) {
      console.error('Error fetching global orders:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchAllOrders();
    }
  }, [isAdmin]);

  // Handle Admin Sign In
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    setLoginSubmitting(true);

    try {
      if (adminEmail.trim().toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        throw new Error('Access Denied. Only the authorized Admin email can log into the Admin Portal.');
      }
      await signIn(adminEmail.trim(), adminPassword);
    } catch (err: any) {
      console.error('Admin login error:', err);
      setLoginError(err.message || 'Invalid admin email or password.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleSendResetEmail = async () => {
    setLoginError('');
    setLoginSuccess('');
    try {
      const targetEmail = adminEmail.trim() || ADMIN_EMAIL;
      await resetPassword(targetEmail);
      setLoginSuccess(`Password reset link sent to ${targetEmail}. Please check your email inbox!`);
    } catch (err: any) {
      setLoginError(err.message || 'Failed to send password reset email.');
    }
  };



  // Update Booking Status
  const handleUpdateStatus = async (orderId: string, userId: string, newStatus: OrderRecord['status']) => {
    setUpdatingOrderId(orderId);
    try {
      // 1. Update in global orders collection
      const globalDocRef = doc(db, 'orders', orderId);
      await updateDoc(globalDocRef, { status: newStatus });

      // 2. Update in user's orders subcollection if userId exists
      if (userId) {
        try {
          const userDocRef = doc(db, 'users', userId, 'orders', orderId);
          await updateDoc(userDocRef, { status: newStatus });
        } catch (e) {}
      }

      // Update local state
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch (e) {
      console.error('Failed to update order status:', e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Delete Booking
  const handleDeleteBooking = async (orderId: string, userId: string) => {
    if (!window.confirm(`Are you sure you want to delete order #${orderId.slice(0, 8)}?`)) return;

    try {
      await deleteDoc(doc(db, 'orders', orderId));
      if (userId) {
        try {
          await deleteDoc(doc(db, 'users', userId, 'orders', orderId));
        } catch (e) {}
      }
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (e) {
      console.error('Failed to delete order:', e);
    }
  };

  // Create New Manual Booking from Admin End
  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);

    try {
      let bookingItem: CartItem;
      let targetProduct: Product | undefined;

      if (selectedProductId) {
        targetProduct = products.find((p) => p.id === selectedProductId);
        if (!targetProduct) throw new Error('Selected product not found.');
        bookingItem = {
          product: targetProduct,
          quantity: itemQuantity,
        };
      } else if (customItemTitle && customItemPrice) {
        const priceNum = parseFloat(customItemPrice);
        if (isNaN(priceNum) || priceNum <= 0) throw new Error('Please enter a valid selling price.');
        targetProduct = {
          id: `MANUAL-${Date.now().toString().slice(-4)}`,
          title: customItemTitle,
          category: 'Custom Booking',
          sellingPrice: priceNum,
          mrp: priceNum * 1.2,
          condition: 'Refurbished',
          images: ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=400&q=80'],
          status: 'Available',
          quantity: itemQuantity,
          description: 'Manually created booking from Admin End',
          createdAt: new Date().toISOString(),
        };
        bookingItem = {
          product: targetProduct,
          quantity: itemQuantity,
        };
      } else {
        throw new Error('Please select a catalog product or enter custom item details.');
      }

      const totalAmount = bookingItem.product.sellingPrice * bookingItem.quantity;
      const guestUserId = `guest_${Date.now()}`;

      const rawMessage = `Hi ${customerName}! Your booking (#MANUAL) with Malik Enterprises has been created:
📦 Item: ${bookingItem.product.title} (x${bookingItem.quantity})
💰 Amount: ₹${totalAmount.toLocaleString('en-IN')}
📍 Address: ${shippingAddress}
📋 Status: ${bookingStatus}`;

      const whatsappUrl = `https://wa.me/${customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(rawMessage)}`;

      const newOrderData: Omit<OrderRecord, 'id'> = {
        userId: guestUserId,
        items: [bookingItem],
        totalAmount,
        status: bookingStatus,
        shippingAddress,
        phone: customerPhone,
        createdAt: new Date().toISOString(),
        whatsappUrl,
      };

      const docRef = await addDoc(collection(db, 'orders'), newOrderData);
      const createdRecord: OrderRecord = { id: docRef.id, ...newOrderData };

      setOrders((prev) => [createdRecord, ...prev]);

      // Reset form
      setIsCreateModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setShippingAddress('');
      setSelectedProductId('');
      setCustomItemTitle('');
      setCustomItemPrice('');
      setItemQuantity(1);
    } catch (err: any) {
      console.error('Create booking error:', err);
      setCreateError(err.message || 'Failed to create booking.');
    } finally {
      setCreateSubmitting(false);
    }
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const totalCount = orders.length;
    const totalRev = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    const processingCount = orders.filter((o) => o.status === 'Processing').length;
    const confirmedCount = orders.filter((o) => o.status === 'Confirmed' || o.status === 'Dispatched').length;
    const deliveredCount = orders.filter((o) => o.status === 'Delivered').length;

    return { totalCount, totalRev, processingCount, confirmedCount, deliveredCount };
  }, [orders]);

  // Filtered Orders List
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const queryLower = searchQuery.toLowerCase().trim();
      const matchesSearch =
        queryLower === '' ||
        o.id.toLowerCase().includes(queryLower) ||
        o.phone.toLowerCase().includes(queryLower) ||
        o.shippingAddress.toLowerCase().includes(queryLower) ||
        o.items?.some((i) => i.product.title.toLowerCase().includes(queryLower));

      const matchesStatus = statusFilter === 'All' || o.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-emerald-400 border-t-transparent" />
          <p className="text-xs text-slate-400 font-medium">Verifying Admin Credentials...</p>
        </div>
      </div>
    );
  }

  // 1. ADMIN LOGIN GUARD SCREEN
  if (!currentUser || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

          <div className="text-center space-y-2 relative z-10">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">Malik Admin Portal</h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Secure administrative access for customer bookings, order status & catalog management.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 relative z-10">
            {loginError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{loginSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Admin Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="Enter Admin Email Address"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-300">Admin Password</label>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  className="text-[11px] text-emerald-400 hover:underline font-semibold"
                >
                  Reset Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3 bg-[#043d27] hover:bg-[#002b1b] text-white font-bold text-xs rounded-lg shadow-lg disabled:opacity-50 transition-all flex items-center justify-center gap-2 border border-emerald-600/40"
            >
              {loginSubmitting ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Admin Sign In</span>
                </>
              )}
            </button>
          </form>


          <div className="pt-4 border-t border-slate-800 text-center">
            <a href="/" className="text-xs font-medium text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 2. ADMIN DASHBOARD SCREEN
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* ADMIN HEADER BAR */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-base text-white tracking-tight">Malik Admin Portal</h1>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                  LIVE CONTROLS
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Logged in as {currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchAllOrders}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
              title="Refresh Bookings"
            >
              <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
            </button>

            <a
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Storefront</span>
            </a>

            <button
              onClick={() => logOut()}
              className="px-3 py-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 font-bold text-xs border border-red-500/40 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* DASHBOARD CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ANALYTICS SUMMARY STATS CARDS */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">
              ₹{metrics.totalRev.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-slate-500">From all bookings</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Bookings</span>
              <Package className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-xl font-black text-white font-mono">{metrics.totalCount}</div>
            <div className="text-[10px] text-slate-500">Customer orders</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Processing</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-400 font-mono">{metrics.processingCount}</div>
            <div className="text-[10px] text-slate-500">Awaiting confirmation</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Dispatch</span>
              <Truck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-black text-blue-400 font-mono">{metrics.confirmedCount}</div>
            <div className="text-[10px] text-slate-500">Confirmed / Dispatched</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Delivered</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">{metrics.deliveredCount}</div>
            <div className="text-[10px] text-slate-500">Completed bookings</div>
          </div>
        </div>

        {/* CONTROLS BAR: SEARCH, STATUS TABS & NEW BOOKING */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-sm">
          {/* SEARCH BAR */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search by Customer, Phone, Address, Order ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* STATUS FILTER PILLS & ACTION BUTTON */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {['All', 'Processing', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="ml-auto sm:ml-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New Booking</span>
            </button>
          </div>
        </div>

        {/* BOOKINGS LIST TABLE / CARD VIEW */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-sm text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>Customer Bookings & Orders</span>
              <span className="text-xs font-normal text-slate-400">({filteredOrders.length})</span>
            </h2>
          </div>

          {loadingOrders ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-emerald-400 border-t-transparent" />
              <p className="text-xs text-slate-400">Fetching latest bookings from Firebase...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-300 text-sm">No Bookings Found</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                No customer bookings match your current search or status filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-4 sm:p-5 hover:bg-slate-800/40 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-emerald-400">
                          #{order.id.slice(0, 12)}
                        </span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {new Date(order.createdAt).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400" />
                        <span>{order.phone ? `Customer (${order.phone})` : 'Customer Booking'}</span>
                      </div>
                    </div>

                    {/* INTERACTIVE STATUS CHANGE CONTROL */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <select
                          value={order.status}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, order.userId, e.target.value as OrderRecord['status'])
                          }
                          className={`appearance-none font-bold text-xs px-3 py-1.5 pr-7 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                            order.status === 'Processing'
                              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                              : order.status === 'Confirmed'
                              ? 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                              : order.status === 'Dispatched'
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                              : order.status === 'Delivered'
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-red-500/10 text-red-300 border-red-500/30'
                          }`}
                        >
                          <option value="Processing">Processing</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Dispatched">Dispatched</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none opacity-60" />
                      </div>

                      {order.whatsappUrl && (
                        <a
                          href={order.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-colors"
                          title="Open WhatsApp Chat"
                        >
                          <MessageCircle className="w-4 h-4 fill-current" />
                        </a>
                      )}

                      <button
                        onClick={() => handleDeleteBooking(order.id, order.userId)}
                        className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20 transition-colors"
                        title="Delete Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* ITEMS LIST IN BOOKING */}
                  <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 space-y-2">
                    {order.items?.map(({ product, quantity }) => (
                      <div key={product.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <img
                            src={
                              product.images[0] ||
                              'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=150&q=80'
                            }
                            alt=""
                            className="w-7 h-7 rounded object-cover bg-slate-800 shrink-0"
                          />
                          <span className="font-medium text-slate-200 truncate">{product.title}</span>
                          <span className="text-slate-500 font-mono">x{quantity}</span>
                        </div>
                        <span className="font-bold text-white shrink-0 ml-2">
                          ₹{(product.sellingPrice * quantity).toLocaleString('en-IN')}
                        </span>
                      </div>
                    ))}

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="text-slate-400 flex items-center gap-1.5 max-w-md truncate">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span className="truncate">{order.shippingAddress || 'No Address'}</span>
                        {order.phone && <span className="text-slate-500">({order.phone})</span>}
                      </div>
                      <div className="font-black text-sm text-emerald-400">
                        Total: ₹{order.totalAmount?.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* CREATE NEW BOOKING MODAL (ADMIN END) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="fixed inset-0" onClick={() => setIsCreateModalOpen(false)} />

          <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full shadow-2xl z-10 overflow-hidden my-6">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base text-white">Create New Booking (Admin End)</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {createError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-3">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Customer Details
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Customer Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Vikram Singh"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">WhatsApp Phone</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Delivery Address</label>
                  <textarea
                    required
                    rows={2}
                    placeholder="Enter full street, city, pin code..."
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Booking Items Selection
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Select Catalog Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      if (e.target.value) {
                        setCustomItemTitle('');
                        setCustomItemPrice('');
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose item from store inventory --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} • ₹{p.sellingPrice.toLocaleString('en-IN')} (Stock: {p.quantity || 1})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedProductId && (
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
                    <div className="text-xs font-bold text-slate-400">Or Enter Custom Item:</div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <input
                          type="text"
                          placeholder="Custom Product Title"
                          value={customItemTitle}
                          onChange={(e) => setCustomItemTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <input
                          type="number"
                          placeholder="Selling Price (₹)"
                          value={customItemPrice}
                          onChange={(e) => setCustomItemPrice(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Quantity</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Initial Status</label>
                    <select
                      value={bookingStatus}
                      onChange={(e) => setBookingStatus(e.target.value as OrderRecord['status'])}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Processing">Processing</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Dispatched">Dispatched</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="w-2/3 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createSubmitting ? (
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Save & Publish Booking</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
