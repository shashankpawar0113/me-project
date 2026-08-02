'use client';

import React from 'react';
import { Product } from '@/types/product';
import { ShoppingBag, Ban, Eye } from 'lucide-react';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  onOpenModal: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenModal }) => {
  const { addToCart } = useCart();
  const isSold = product.status === 'Sold';

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSold) return;
    addToCart(product, 1);
  };

  const getBadgeStyle = () => {
    if (isSold) {
      return 'bg-slate-300 text-slate-700 font-bold';
    }
    switch (product.condition.toUpperCase()) {
      case 'LIKE NEW':
        return 'bg-[#8ef5b5] text-[#007243] font-bold';
      case 'REFURBISHED':
        return 'bg-slate-200 text-slate-700 font-semibold';
      default:
        return 'bg-emerald-100 text-emerald-900 font-semibold';
    }
  };

  return (
    <div
      onClick={() => onOpenModal(product)}
      className="bg-white rounded-lg border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between cursor-pointer p-3 sm:p-4 group"
    >
      <div>
        {/* TOP CONDITION & STOCK BADGES */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-block px-2.5 py-0.5 text-[10px] sm:text-[11px] uppercase tracking-wider rounded ${getBadgeStyle()}`}
          >
            {isSold ? 'SOLD OUT' : product.condition}
          </span>
          {!isSold && product.quantity && product.quantity > 1 && (
            <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {product.quantity} in stock
            </span>
          )}
        </div>

        {/* CENTERED IMAGE CONTAINER */}
        <div className="relative aspect-square w-full bg-slate-50 rounded mb-3 overflow-hidden flex items-center justify-center">
          <img
            src={
              product.images[0] ||
              'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=600&q=80'
            }
            alt={product.title}
            className={`w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105 ${
              isSold ? 'opacity-50 grayscale' : ''
            }`}
            loading="lazy"
          />
          <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="px-3 py-1.5 bg-white/90 backdrop-blur-xs rounded-full text-slate-900 font-bold text-xs shadow-md flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> View Details
            </span>
          </div>
        </div>

        {/* TITLE & PRICING */}
        <div className="space-y-1 mb-3">
          <h3 className="font-bold text-slate-900 text-sm sm:text-base line-clamp-1">
            {product.title}
          </h3>

          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-extrabold text-[#043d27]">
              ₹{product.sellingPrice.toLocaleString('en-IN')}
            </span>
            {product.mrp > product.sellingPrice && (
              <span className="text-xs text-slate-400 line-through">
                ₹{product.mrp.toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* FULL-WIDTH ADD TO CART BUTTON */}
      <button
        onClick={handleAddToCart}
        disabled={isSold}
        className={`w-full py-2.5 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all ${
          isSold
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            : 'bg-[#043d27] hover:bg-[#002b1b] active:bg-[#001f13] text-white shadow-xs'
        }`}
      >
        {isSold ? (
          <>
            <Ban className="w-3.5 h-3.5" />
            <span>Currently Unavailable</span>
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span>Add to Cart</span>
          </>
        )}
      </button>
    </div>
  );
};
