'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { db } from '@/lib/firebase';
import { ensureFirebaseAuth } from '@/lib/ensureFirebaseAuth';
import {
  collection,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';

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

  // Real-time listener on Firestore 'products' collection
  useEffect(() => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetched: Product[] = [];
        snapshot.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() } as Product);
        });
        setProducts(fetched);
      },
      (error) => {
        console.error('Firestore products listener error:', error);
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshProducts = async () => {
    // With onSnapshot, data is always live — this is a no-op for compatibility
  };

  const addProduct = async (newProdData: Omit<Product, 'id' | 'createdAt'> & { id?: string }) => {
    try {
      await ensureFirebaseAuth();

      const productToAdd = {
        title: newProdData.title,
        sellingPrice: newProdData.sellingPrice,
        mrp: newProdData.mrp,
        condition: newProdData.condition,
        status: newProdData.status || 'Available',
        category: newProdData.category,
        images: newProdData.images || [],
        description: newProdData.description || '',
        quantity: newProdData.quantity || 1,
        createdAt: new Date().toISOString(),
      };

      if (newProdData.id && newProdData.id.trim()) {
        // Use the custom ID as the Firestore document ID
        const docRef = doc(db, 'products', newProdData.id.trim());
        await setDoc(docRef, productToAdd);
      } else {
        await addDoc(collection(db, 'products'), productToAdd);
      }
      // onSnapshot will automatically update the local state
    } catch (e) {
      console.error('Failed to add product to Firestore:', e);
      throw e;
    }
  };

  const toggleSoldStatus = async (id: string) => {
    const target = products.find((p) => p.id === id);
    if (!target) {
      throw new Error('Product not found.');
    }
    const nextStatus = target.status === 'Sold' ? 'Available' : 'Sold';

    try {
      await ensureFirebaseAuth();
      await updateDoc(doc(db, 'products', id), { status: nextStatus });
      // onSnapshot will automatically update the local state
    } catch (e) {
      console.error('Failed to update product status in Firestore:', e);
      throw e;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await ensureFirebaseAuth();
      await deleteDoc(doc(db, 'products', id));
      // onSnapshot will automatically update the local state
    } catch (e) {
      console.error('Failed to delete product from Firestore:', e);
      throw e;
    }
  };

  const resetToSeedData = async () => {
    // No-op — real-time data is always up to date
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
