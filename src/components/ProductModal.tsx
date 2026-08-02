'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { X, MessageCircle, ShieldCheck, ChevronLeft, ChevronRight, Minus, Plus } from 'lucide-react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [orderQty, setOrderQty] = useState(1);

  useEffect(() => {
    setSelectedImageIndex(0);
    setOrderQty(1);
  }, [product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const maxStock = product.quantity ?? 1;
  const isSold = product.status === 'Sold' || maxStock <= 0;
  const discountPercent = Math.round(((product.mrp - product.sellingPrice) / product.mrp) * 100);

  const totalPrice = product.sellingPrice * orderQty;

  const rawMessage = `Hi Malik Enterprises! I would like to order:
📦 Product: ${product.title}
🏷️ Item ID: #${product.id}
🔢 Quantity: ${orderQty}
💰 Total Price: ₹${totalPrice.toLocaleString('en-IN')} (₹${product.sellingPrice.toLocaleString('en-IN')} x ${orderQty})`;

  const whatsappUrl = `https://wa.me/917078523738?text=${encodeURIComponent(rawMessage)}`;

  const images =
    product.images.length > 0
      ? product.images
      : ['https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=1000&q=80'];

  const nextImage = () => {
    setSelectedImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden z-10 my-6 border border-slate-200 flex flex-col md:flex-row">
        {/* CLOSE BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* LEFT GALLERY */}
        <div className="md:w-1/2 bg-slate-50 p-5 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-200">
          <div>
            <div className="relative aspect-square rounded overflow-hidden bg-slate-200 border border-slate-200">
              <img
                src={images[selectedImageIndex]}
                alt={product.title}
                className="w-full h-full object-cover"
              />

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded border-2 overflow-hidden shrink-0 ${
                      selectedImageIndex === idx ? 'border-[#043d27]' : 'border-slate-200 opacity-60'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 p-3 rounded bg-emerald-50 text-emerald-950 text-xs flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#043d27] shrink-0" />
            <span>100% Inspected & Sanitized Pre-Owned Item</span>
          </div>
        </div>

        {/* RIGHT DETAILS */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold uppercase tracking-wider text-slate-500">
                {product.category}
              </span>
              <span className="font-mono font-semibold text-slate-700">ID: #{product.id}</span>
            </div>

            <h2 className="text-xl font-bold text-slate-900 leading-tight">
              {product.title}
            </h2>

            <div className="flex items-center gap-2">
              <div className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-[#8ef5b5] text-[#007243]">
                Condition: {product.condition}
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                Stock: {maxStock} available
              </div>
            </div>

            <div className="p-3.5 rounded bg-slate-50 border border-slate-200 space-y-1">
              <div className="text-xs text-slate-500 font-medium">Direct WhatsApp Price</div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-[#043d27]">
                  ₹{product.sellingPrice.toLocaleString('en-IN')}
                </span>
                {product.mrp > product.sellingPrice && (
                  <span className="text-sm text-slate-400 line-through">
                    ₹{product.mrp.toLocaleString('en-IN')}
                  </span>
                )}
              </div>
              {discountPercent > 0 && (
                <div className="text-xs font-bold text-[#006d40]">
                  Save {discountPercent}% off original retail price!
                </div>
              )}
            </div>

            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Description & Specs
              </div>
              <p className="text-slate-600 text-xs leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-3">
            {/* INTERACTIVE QUANTITY PICKER */}
            {!isSold && (
              <div className="flex items-center justify-between p-2.5 rounded bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Select Quantity:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 rounded bg-white overflow-hidden shadow-2xs">
                    <button
                      onClick={() => setOrderQty((prev) => Math.max(1, prev - 1))}
                      disabled={orderQty <= 1}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-slate-900 font-mono">
                      {orderQty}
                    </span>
                    <button
                      onClick={() => setOrderQty((prev) => Math.min(maxStock, prev + 1))}
                      disabled={orderQty >= maxStock}
                      className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs font-bold text-[#043d27]">
                    Total: ₹{totalPrice.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            )}

            <a
              href={isSold ? undefined : whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`w-full py-3 px-4 rounded text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                isSold
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-[#043d27] hover:bg-[#002b1b] text-white shadow-md'
              }`}
            >
              <MessageCircle className="w-5 h-5 fill-current" />
              <span>
                {isSold
                  ? 'Currently Unavailable'
                  : `Order ${orderQty} ${orderQty > 1 ? 'Items' : 'Item'} via WhatsApp • ₹${totalPrice.toLocaleString('en-IN')}`}
              </span>
            </a>

            <div className="text-center text-[11px] text-slate-500 pt-1">
              <span>Direct connect with Malik Enterprises</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
