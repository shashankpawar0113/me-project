'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';

const INITIAL_SEED_DATA: Product[] = [];

const LOCAL_STORAGE_KEY = 'malik_ethos_inventory_v3';

interface InventoryContextType {
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => void;
  toggleSoldStatus: (id: string) => void;
  deleteProduct: (id: string) => void;
  resetToSeedData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(INITIAL_SEED_DATA);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setProducts(parsed);
        }
      } else {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
      }
    } catch (e) {
      console.error('Failed to load inventory from localStorage', e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Sync state to localStorage whenever products change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(products));
      } catch (e) {
        console.error('Failed to save inventory to localStorage', e);
      }
    }
  }, [products, isHydrated]);

  const addProduct = (newProdData: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => {
    const nextIdNumber =
      products.reduce((max, p) => {
        const num = parseInt(p.id.replace(/\D/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 100) + 1;

    const finalId = newProdData.id?.trim() || `PRD-${nextIdNumber}`;

    const newProduct: Product = {
      ...newProdData,
      id: finalId,
      createdAt: new Date().toISOString(),
    };

    setProducts((prev) => {
      const next = [newProduct, ...prev];
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('LocalStorage write error', e);
      }
      return next;
    });
  };

  const toggleSoldStatus = (id: string) => {
    setProducts((prev) => {
      const next = prev.map((p) => {
        if (p.id === id) {
          return { ...p, status: (p.status === 'Available' ? 'Sold' : 'Available') as 'Available' | 'Sold' };
        }
        return p;
      });
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('LocalStorage write error', e);
      }
      return next;
    });
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('LocalStorage write error', e);
      }
      return next;
    });
  };

  const resetToSeedData = () => {
    setProducts([]);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([]));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <InventoryContext.Provider
      value={{
        products,
        addProduct,
        toggleSoldStatus,
        deleteProduct,
        resetToSeedData,
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
