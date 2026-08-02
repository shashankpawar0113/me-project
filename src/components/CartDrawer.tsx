'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { X, ShoppingBag, Trash2, Plus, Minus, ArrowRight, MessageCircle, MapPin, Phone } from 'lucide-react';

export const CartDrawer: React.FC = () => {
  const {
    items,
    isCartOpen,
    closeCart,
    removeFromCart,
    updateQuantity,
    checkoutOrder,
    totalItemsCount,
    totalCartPrice,
  } = useCart();
  const { userData, currentUser } = useAuth();

  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCheckoutForm, setShowCheckoutForm] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsSubmitting(true);
    try {
      await checkoutOrder(address, phone || userData?.phone || '');
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <div className="fixed inset-0" onClick={closeCart} />

      <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between z-10 animate-slideLeft">
        {/* HEADER */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#043d27] flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 leading-tight">Your Cart</h2>
              <p className="text-xs text-slate-500">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</p>
            </div>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* BODY - CART ITEMS LIST */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Your Cart is Empty</h3>
                <p className="text-xs text-slate-500 max-w-xs">
                  Browse our catalog and add refurbished furniture, electronics & accessories to your cart.
                </p>
              </div>
              <button
                onClick={closeCart}
                className="px-5 py-2.5 bg-[#043d27] text-white text-xs font-bold rounded-lg shadow-xs"
              >
                Explore Catalog
              </button>
            </div>
          ) : (
            items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white shadow-2xs hover:border-emerald-200 transition-colors"
              >
                <img
                  src={
                    product.images[0] ||
                    'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=300&q=80'
                  }
                  alt={product.title}
                  className="w-16 h-16 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 truncate">{product.title}</h4>
                  <p className="text-[11px] text-slate-500">ID: #{product.id}</p>
                  <p className="font-black text-xs text-[#043d27] mt-0.5">
                    ₹{product.sellingPrice.toLocaleString('en-IN')}{' '}
                    <span className="text-[10px] font-normal text-slate-400">each</span>
                  </p>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center border border-slate-300 rounded bg-slate-50 overflow-hidden">
                    <button
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900 font-mono">
                      {quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      disabled={quantity >= (product.quantity || 99)}
                      className="w-6 h-6 flex items-center justify-center text-slate-600 hover:bg-slate-200 disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* FOOTER CHECKOUT AREA */}
        {items.length > 0 && (
          <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50 space-y-4">
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-semibold text-slate-900">₹{totalCartPrice.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Delivery / WhatsApp Dispatch</span>
                <span className="font-bold text-emerald-700">Free Direct Connect</span>
              </div>
              <div className="flex items-center justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Amount</span>
                <span className="text-[#043d27]">₹{totalCartPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {!showCheckoutForm ? (
              <button
                onClick={() => {
                  setPhone(userData?.phone || '');
                  setShowCheckoutForm(true);
                }}
                className="w-full py-3 bg-[#043d27] hover:bg-[#002b1b] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md transition-all"
              >
                <span>Proceed to Delivery & Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <form onSubmit={handleCheckout} className="space-y-3 pt-2 border-t border-slate-200 animate-fadeIn">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Delivery Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <textarea
                      required
                      rows={2}
                      placeholder="Enter street, city, pin code..."
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCheckoutForm(false)}
                    className="py-2.5 px-3 bg-slate-200 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-[#043d27] hover:bg-[#002b1b] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Place Order & Open WhatsApp</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
