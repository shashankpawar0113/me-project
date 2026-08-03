'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { useAuth } from '@/context/AuthContext';
import { doc, setDoc, getDoc, collection, addDoc, getDocs, query, orderBy, onSnapshot } from 'firebase/firestore';
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
  email?: string;
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
  checkoutOrder: (shippingAddress: string, phone: string, customerName?: string, customerEmail?: string) => Promise<OrderRecord | null>;
  orders: OrderRecord[];
  loadingOrders: boolean;
  refreshOrders: () => Promise<void>;
  totalItemsCount: number;
  totalCartPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userData } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  // Sync cart from Firestore or localStorage
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

  // Real-time listener for customer order status changes
  useEffect(() => {
    if (!currentUser) {
      setOrders([]);
      setLoadingOrders(false);
      return;
    }

    setLoadingOrders(true);
    const globalRef = collection(db, 'orders');
    const q = query(globalRef, orderBy('createdAt', 'desc'));
    const userEmailLower = (userData?.email || currentUser.email || '').toLowerCase();

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: OrderRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as OrderRecord;
          if (
            data.userId === currentUser.uid ||
            (userEmailLower && data.email?.toLowerCase() === userEmailLower)
          ) {
            fetchedOrders.push({ ...data, id: data.id || docSnap.id });
          }
        });

        const map = new Map<string, OrderRecord>();
        fetchedOrders.forEach((o) => map.set(o.id, o));
        const sorted = Array.from(map.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrders(sorted);
        setLoadingOrders(false);
      },
      (error) => {
        console.warn('Real-time order listener error:', error);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, userData]);

  const refreshOrders = async () => {
    // Handled in real-time via onSnapshot
  };

  const addToCart = (product: Product, quantity: number = 1): boolean => {
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

  const checkoutOrder = async (
    shippingAddress: string,
    phone: string,
    customerName?: string,
    customerEmail?: string
  ): Promise<OrderRecord | null> => {
    if (items.length === 0) return null;

    const totalAmount = items.reduce((sum, item) => sum + item.product.sellingPrice * item.quantity, 0);
    const displayName = customerName || userData?.name || currentUser?.displayName || 'Valued Customer';
    const displayPhone = phone || userData?.phone || '';
    const displayEmail = customerEmail || userData?.email || currentUser?.email || '';

    // Build readable WhatsApp message
    const itemDetailsText = items
      .map(
        (i) =>
          `• ${i.product.title} (#${i.product.id}) x ${i.quantity} = ₹${(i.product.sellingPrice * i.quantity).toLocaleString('en-IN')}`
      )
      .join('\n');

    const message = `Hi Malik Enterprises! I would like to place an order:

👤 Customer: ${displayName}
✉️ Email: ${displayEmail || 'Not specified'}
📞 Phone: ${displayPhone}
📍 Address: ${shippingAddress}

📦 Ordered Items:
${itemDetailsText}

💰 Total Amount: ₹${totalAmount.toLocaleString('en-IN')}
🗓️ Date: ${new Date().toLocaleDateString('en-IN')}`;

    const whatsappUrl = `https://wa.me/917078523738?text=${encodeURIComponent(message)}`;

    const newOrderId = 'ORD-' + Date.now();
    const orderData: OrderRecord = {
      id: newOrderId,
      userId: currentUser?.uid || 'guest_' + Date.now(),
      items: [...items],
      totalAmount,
      status: 'Processing',
      shippingAddress,
      phone: displayPhone,
      email: displayEmail,
      createdAt: new Date().toISOString(),
      whatsappUrl,
    };

    try {
      // Save to main orders collection with explicit order ID
      await setDoc(doc(db, 'orders', newOrderId), orderData);

      // Save to user's orders subcollection if user exists
      if (currentUser) {
        try {
          await setDoc(doc(db, 'users', currentUser.uid, 'orders', newOrderId), orderData);
        } catch (e) {}
      }
    } catch (e) {
      console.warn('Firestore order record skipped (non-blocking for WhatsApp):', e);
    }

    // Save to local customer orders storage
    try {
      const savedLocal = localStorage.getItem('malik_customer_orders_v1');
      const existing: OrderRecord[] = savedLocal ? JSON.parse(savedLocal) : [];
      localStorage.setItem('malik_customer_orders_v1', JSON.stringify([orderData, ...existing]));
    } catch (e) {}

    // Clear cart and update local order state
    clearCart();
    closeCart();
    setOrders((prev) => [orderData, ...prev]);

    // Open WhatsApp for user confirmation
    window.open(whatsappUrl, '_blank');

    return orderData;
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
