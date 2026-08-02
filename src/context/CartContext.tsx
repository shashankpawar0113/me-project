'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'Processing' | 'Confirmed' | 'Dispatched' | 'Delivered' | 'Cancelled';
  shippingAddress: string;
  phone: string;
  createdAt: string;
  whatsappUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, quantity?: number) => boolean;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  checkoutOrder: (shippingAddress: string, phone: string) => Promise<OrderRecord | null>;
  orders: OrderRecord[];
  loadingOrders: boolean;
  refreshOrders: () => Promise<void>;
  totalItemsCount: number;
  totalCartPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userData, openAuthModal } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Sync cart from Firestore or localStorage when user changes
  useEffect(() => {
    const loadCart = async () => {
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists() && docSnap.data().cart) {
            setItems(docSnap.data().cart);
            return;
          }
        } catch (e) {
          console.error('Error fetching cart from Firestore:', e);
        }
      }
      // Fallback local storage check
      try {
        const saved = localStorage.getItem('malik_cart_v1');
        if (saved) {
          setItems(JSON.parse(saved));
        } else {
          setItems([]);
        }
      } catch (e) {
        console.error('LocalStorage read error:', e);
      }
    };

    loadCart();
  }, [currentUser]);

  // Persist cart updates to Firestore or LocalStorage
  const saveCartToStorage = async (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem('malik_cart_v1', JSON.stringify(newItems));
    } catch (e) {}

    if (currentUser) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), { cart: newItems }, { merge: true });
      } catch (e) {
        console.error('Failed to sync cart to Firestore:', e);
      }
    }
  };

  // Fetch orders for active logged in user
  const refreshOrders = async () => {
    if (!currentUser) {
      setOrders([]);
      return;
    }
    setLoadingOrders(true);
    try {
      const ordersColRef = collection(db, 'users', currentUser.uid, 'orders');
      const q = query(ordersColRef, orderBy('createdAt', 'desc'));
      const querySnap = await getDocs(q);
      const fetchedOrders: OrderRecord[] = [];
      querySnap.forEach((docSnap) => {
        fetchedOrders.push({ id: docSnap.id, ...docSnap.data() } as OrderRecord);
      });
      setOrders(fetchedOrders);
    } catch (e) {
      console.error('Failed to fetch user orders from Firestore:', e);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    refreshOrders();
  }, [currentUser]);

  const addToCart = (product: Product, quantity: number = 1): boolean => {
    if (!currentUser) {
      openAuthModal('signin');
      return false;
    }

    const existingIdx = items.findIndex((i) => i.product.id === product.id);
    let updated: CartItem[];

    if (existingIdx > -1) {
      updated = items.map((item, idx) =>
        idx === existingIdx ? { ...item, quantity: item.quantity + quantity } : item
      );
    } else {
      updated = [...items, { product, quantity }];
    }

    saveCartToStorage(updated);
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (productId: string) => {
    const updated = items.filter((i) => i.product.id !== productId);
    saveCartToStorage(updated);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updated = items.map((i) =>
      i.product.id === productId ? { ...i, quantity } : i
    );
    saveCartToStorage(updated);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  const checkoutOrder = async (shippingAddress: string, phone: string): Promise<OrderRecord | null> => {
    if (!currentUser || items.length === 0) return null;

    const totalAmount = items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);

    // Build readable WhatsApp message
    const itemDetailsText = items
      .map(
        (i) =>
          `• ${i.product.title} (#${i.product.id}) x ${i.quantity} = ₹${(i.product.sellingPrice * i.quantity).toLocaleString('en-IN')}`
      )
      .join('\n');

    const message = `Hi Malik Enterprises! I would like to place an order:

👤 Customer: ${userData?.name || currentUser.displayName || 'Customer'}
📞 Phone: ${phone || userData?.phone || ''}
📍 Address: ${shippingAddress}

📦 Ordered Items:
${itemDetailsText}

💰 Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
🗓️ Date: ${new Date().toLocaleDateString('en-IN')}`;

    const whatsappUrl = `https://wa.me/917078523738?text=${encodeURIComponent(message)}`;

    const orderData: Omit<OrderRecord, 'id'> = {
      userId: currentUser.uid,
      items,
      totalAmount,
      status: 'Processing',
      shippingAddress,
      phone: phone || userData?.phone || '',
      createdAt: new Date().toISOString(),
      whatsappUrl,
    };

    try {
      // 1. Save into main orders collection
      const mainOrdersRef = collection(db, 'orders');
      const docRef = await addDoc(mainOrdersRef, orderData);

      // 2. Save into user's orders subcollection
      const userOrdersRef = collection(db, 'users', currentUser.uid, 'orders');
      await setDoc(doc(db, 'users', currentUser.uid, 'orders', docRef.id), {
        ...orderData,
        id: docRef.id,
      });

      const finalOrderRecord: OrderRecord = { id: docRef.id, ...orderData };

      // Clear cart
      clearCart();
      closeCart();

      // Refresh local orders list
      setOrders((prev) => [finalOrderRecord, ...prev]);

      // Open WhatsApp for user confirmation
      window.open(whatsappUrl, '_blank');

      return finalOrderRecord;
    } catch (e) {
      console.error('Error recording order to Firestore:', e);
      // Even if Firestore write fails, launch WhatsApp so order isn't lost
      window.open(whatsappUrl, '_blank');
      clearCart();
      closeCart();
      return null;
    }
  };

  const totalItemsCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalCartPrice = items.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        openCart,
        closeCart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        checkoutOrder,
        orders,
        loadingOrders,
        refreshOrders,
        totalItemsCount,
        totalCartPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
