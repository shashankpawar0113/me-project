'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';

const LOCAL_STORAGE_KEY = 'malik_ethos_inventory_v3';

interface InventoryContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => Promise<void>;
  toggleSoldStatus: (id: string) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetToSeedData: () => Promise<void>;
  refreshProducts: () => Promise<void>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Fetch products from server API on mount
  const refreshProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
          } catch (e) {
            console.error('LocalStorage write error', e);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load inventory from API, attempting localStorage fallback', e);
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setProducts(parsed);
          }
        }
      } catch (err) {
        console.error('LocalStorage read error', err);
      }
    } finally {
      setIsHydrated(true);
    }
  };

  useEffect(() => {
    refreshProducts();
  }, []);

  const addProduct = async (newProdData: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => {
    // Immediate optimistic update for fast UX
    const nextIdNumber =
      products.reduce((max, p) => {
        const num = parseInt(p.id.replace(/\D/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 100) + 1;

    const tempId = newProdData.id?.trim() || `PRD-${nextIdNumber}`;
    const optimisticProduct: Product = {
      ...newProdData,
      id: tempId,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => [optimisticProduct, ...prev]);

    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProdData),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.products));
        }
      }
    } catch (e) {
      console.error('Failed to sync added product with server', e);
    }
  };

  const toggleSoldStatus = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) return;
    const nextStatus = target.status === 'Available' ? 'Sold' : 'Available';

    // Immediate optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: nextStatus as 'Available' | 'Sold' } : p))
    );

    try {
      const res = await fetch('/api/products', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.products));
        }
      }
    } catch (e) {
      console.error('Failed to sync product status with server', e);
    }
  };

  const deleteProduct = async (id: string) => {
    // Immediate optimistic update
    setProducts((prev) => prev.filter((p) => p.id !== id));

    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.products) {
          setProducts(data.products);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.products));
        }
      }
    } catch (e) {
      console.error('Failed to delete product on server', e);
    }
  };

  const resetToSeedData = async () => {
    await refreshProducts();
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        addProduct,
        toggleSoldStatus,
        deleteProduct,
        resetToSeedData,
        refreshProducts,
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
