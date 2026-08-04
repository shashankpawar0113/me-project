'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth, ADMIN_EMAIL } from '@/context/AuthContext';
import { useInventory } from '@/context/InventoryContext';
import { auth, db } from '@/lib/firebase';
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
  onSnapshot,
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

export interface AdminAccount {
  id: string;
  email: string;
  name: string;
  role: 'staff' | 'member' | 'master_admin';
  createdAt: string;
  password?: string;
}

const DEFAULT_MASTER_ADMIN: AdminAccount = {
  id: 'master_admin_01',
  email: ADMIN_EMAIL,
  name: 'Malik Admin',
  role: 'master_admin',
  createdAt: 'System Primary Admin',
};

const MAX_MASTER_ADMINS = 3;

const ROLE_LABELS: Record<AdminAccount['role'], string> = {
  staff: 'Staff',
  member: 'Member',
  master_admin: 'Admin',
};

const ROLE_COLORS: Record<AdminAccount['role'], string> = {
  staff: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  member: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  master_admin: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
};

export default function AdminPortalPage() {
  const { currentUser, userData, isAdmin, signIn, signInWithGoogle, resetPassword, logOut, loading: authLoading } = useAuth();
  const { products } = useInventory();

  // Check if currently logged in as Primary Master Admin
  const isMasterAdmin =
    currentUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() ||
    currentUser?.email?.toLowerCase().startsWith('shashankpawar0113@gmail') ||
    currentUser?.uid === 'admin_master_0113';

  // Direct localStorage session check — source of truth for admin bypass sessions.
  // This prevents Firebase Auth state flicker from logging out the admin.
  const isAdminSessionActive = (() => {
    if (typeof window === 'undefined') return false;
    try { return localStorage.getItem('malik_admin_session_v1') === 'true'; } catch { return false; }
  })();

  // Current admin account & role permissions
  const currentAdminAccount = useMemo(() => {
    const userEmail = currentUser?.email?.toLowerCase() || '';
    if (!userEmail || userEmail === ADMIN_EMAIL.toLowerCase() || userEmail.startsWith('shashankpawar0113@gmail')) {
      return DEFAULT_MASTER_ADMIN;
    }
    return adminAccounts.find((a) => a.email.toLowerCase() === userEmail) || {
      id: 'current_admin',
      email: userEmail,
      name: currentUser?.displayName || 'Admin',
      role: (userData?.role === 'admin' ? 'master_admin' : 'staff') as AdminAccount['role'],
      createdAt: '',
    };
  }, [currentUser, userData, adminAccounts]);

  const currentRole = currentAdminAccount?.role || 'master_admin';
  const canViewRevenue = isMasterAdmin || currentRole === 'master_admin' || userData?.role === 'admin';

  // Admin Login Form State
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginSuccess, setLoginSuccess] = useState('');
  const [loginSubmitting, setLoginSubmitting] = useState(false);

  // Admin Dashboard State
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  // Admin Accounts Management State
  const [adminAccounts, setAdminAccounts] = useState<AdminAccount[]>([DEFAULT_MASTER_ADMIN]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<AdminAccount['role']>('staff');
  const [newAdminMasterPin, setNewAdminMasterPin] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminSubmitting, setAdminSubmitting] = useState(false);
  // Role-change modal state
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminAccount | null>(null);
  const [roleChangeTo, setRoleChangeTo] = useState<AdminAccount['role']>('staff');
  const [roleChangePin, setRoleChangePin] = useState('');
  const [roleChangeError, setRoleChangeError] = useState('');
  const [roleChangeSubmitting, setRoleChangeSubmitting] = useState(false);

  // Admin Instant Password Reset State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetTargetEmail, setResetTargetEmail] = useState('');
  const [resetSecurityPin, setResetSecurityPin] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetModalError, setResetModalError] = useState('');
  const [resetModalSuccess, setResetModalSuccess] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Security Credentials Management State (PIN & Phone)
  const [isSecuritySettingsModalOpen, setIsSecuritySettingsModalOpen] = useState(false);
  const [currentSecurityPin, setCurrentSecurityPin] = useState('');
  const [newSecurityPin, setNewSecurityPin] = useState('');
  const [newSecurityPhone, setNewSecurityPhone] = useState('');
  const [securityModalError, setSecurityModalError] = useState('');
  const [securityModalSuccess, setSecurityModalSuccess] = useState('');
  const [securitySubmitting, setSecuritySubmitting] = useState(false);

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

  // Process raw Firestore docs into unified, merged order records
  const processOrdersSnapshot = (docs: Array<{ id: string; data: () => any }>) => {
    const map = new Map<string, OrderRecord>();
    docs.forEach((docSnap) => {
      const data = docSnap.data();
      const id = data.id || docSnap.id;
      const record: OrderRecord = { id, ...data };

      const existing = map.get(id);
      if (existing) {
        map.set(id, { ...existing, ...record });
      } else {
        map.set(id, record);
      }
    });

    const unified = Array.from(map.values());
    unified.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return unified;
  };

  // Fetch all orders across all users from Firestore
  const fetchAllOrders = async () => {
    setLoadingOrders(true);
    setOrdersError('');
    try {
      const ordersColRef = collection(db, 'orders');
      const snap = await getDocs(ordersColRef);
      const unified = processOrdersSnapshot(snap.docs);
      setOrders(unified);
      if (unified.length === 0) {
        console.info('Orders collection returned 0 documents. Firebase auth state:', { uid: 'check console' });
      }
    } catch (e: any) {
      console.error('Error fetching global orders:', e);
      const msg = e?.code === 'permission-denied'
        ? '🔒 Firestore Permission Denied — your Firestore Security Rules are blocking reads. Go to Firebase Console → Firestore → Rules and allow reads for authenticated users.'
        : `Error loading orders: ${e?.message || e}`;
      setOrdersError(msg);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch all admin accounts from Firestore + localStorage fallback
  const fetchAdminAccounts = async () => {
    // Load localStorage accounts first
    const localAccounts: AdminAccount[] = (() => {
      try {
        const saved = localStorage.getItem('malik_admin_accounts_v1');
        return saved ? JSON.parse(saved) : [];
      } catch { return []; }
    })();

    const map = new Map<string, AdminAccount>();
    map.set(DEFAULT_MASTER_ADMIN.email.toLowerCase(), DEFAULT_MASTER_ADMIN);
    // Seed from localStorage
    localAccounts.forEach((a: AdminAccount) => map.set(a.email.toLowerCase(), a));

    try {
      const adminsRef = collection(db, 'admins');
      const snap = await getDocs(adminsRef);
      snap.forEach((docSnap) => {
        const acc = { id: docSnap.id, ...docSnap.data() } as AdminAccount;
        map.set(acc.email.toLowerCase(), acc); // Firestore overrides localStorage
      });
    } catch (e) {
      console.warn('Firestore admin fetch failed, using localStorage only:', e);
    }

    setAdminAccounts(Array.from(map.values()));
  };

  useEffect(() => {
    if (!isAdmin) return;

    fetchAdminAccounts();
    setLoadingOrders(true);
    setOrdersError('');

    const ordersColRef = collection(db, 'orders');

    // Subscribe to real-time updates directly on the collection
    const unsubscribe = onSnapshot(
      ordersColRef,
      (snap) => {
        const unified = processOrdersSnapshot(snap.docs);
        setOrders(unified);
        setLoadingOrders(false);
        setOrdersError('');
      },
      (err: any) => {
        console.error('Realtime orders error in admin:', err);
        const msg = err?.code === 'permission-denied'
          ? '🔒 Firestore Permission Denied — Go to Firebase Console → Firestore Database → Rules and set: allow read, write: if request.auth != null;'
          : `Realtime listener error: ${err?.message || err}`;
        setOrdersError(msg);
        fetchAllOrders();
      }
    );

    return () => unsubscribe();
  }, [isAdmin]);

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    setAdminSuccess('');

    if (!isMasterAdmin) {
      setAdminError('Only Master Admin can add new admin accounts.');
      return;
    }

    const cleanEmail = newAdminEmail.trim().toLowerCase();
    const cleanName = newAdminName.trim();
    const cleanPass = newAdminPassword.trim();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      setAdminError('Please enter a valid admin email address.');
      return;
    }
    if (!cleanPass || cleanPass.length < 4) {
      setAdminError('Please set a password (minimum 4 characters).');
      return;
    }

    // Enforce Master Admin role rules
    if (newAdminRole === 'master_admin') {
      if (!checkIsValidSecurityPinOrPhone(newAdminMasterPin)) {
        setAdminError('❌ Invalid Master Security PIN / Phone. Required to assign Master Admin role.');
        return;
      }
      const currentMasterCount = adminAccounts.filter((a) => a.role === 'master_admin').length;
      if (currentMasterCount >= MAX_MASTER_ADMINS) {
        setAdminError(`❌ Maximum ${MAX_MASTER_ADMINS} Master Admins allowed. Remove one first.`);
        return;
      }
    }

    setAdminSubmitting(true);
    try {
      const docId = cleanEmail.replace(/[^a-zA-Z0-9]/g, '_');
      const newAccount: AdminAccount = {
        id: docId,
        email: cleanEmail,
        name: cleanName || 'Authorized Admin',
        password: cleanPass,
        role: newAdminRole,
        createdAt: new Date().toISOString(),
      };

      // Try Firestore first; fall back to localStorage if permissions denied
      let firestoreOk = false;
      try {
        await setDoc(doc(db, 'admins', docId), newAccount, { merge: true });
        firestoreOk = true;
      } catch (fsErr: any) {
        console.warn('Firestore admin save failed, using localStorage fallback:', fsErr?.message);
      }

      // Always save to localStorage as source of truth
      try {
        const saved = localStorage.getItem('malik_admin_accounts_v1');
        const existing: AdminAccount[] = saved ? JSON.parse(saved) : [];
        const filtered = existing.filter((a) => a.email.toLowerCase() !== cleanEmail);
        localStorage.setItem('malik_admin_accounts_v1', JSON.stringify([...filtered, newAccount]));
      } catch (e) {}

      setAdminAccounts((prev) => {
        const filtered = prev.filter((a) => a.email.toLowerCase() !== cleanEmail);
        return [...filtered, newAccount];
      });

      setAdminSuccess(
        `✅ ${cleanEmail} added as ${ROLE_LABELS[newAdminRole]}!${
          !firestoreOk ? ' (Saved locally — update Firestore rules to sync across devices)' : ''
        }`
      );
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminPassword('');
      setNewAdminRole('staff');
      setNewAdminMasterPin('');
    } catch (err: any) {
      console.error('Failed to add admin:', err);
      setAdminError(err.message || 'Failed to add admin account.');
    } finally {
      setAdminSubmitting(false);
    }
  };

  const handleChangeAdminRole = async () => {
    if (!roleChangeTarget) return;
    setRoleChangeError('');
    setRoleChangeSubmitting(true);
    try {
      // Assigning Admin always requires PIN
      if (roleChangeTo === 'master_admin') {
        if (!checkIsValidSecurityPinOrPhone(roleChangePin)) {
          setRoleChangeError('❌ Invalid Security PIN / Phone.');
          setRoleChangeSubmitting(false);
          return;
        }
        const currentMasterCount = adminAccounts.filter(
          (a) => a.role === 'master_admin' && a.email.toLowerCase() !== roleChangeTarget.email.toLowerCase()
        ).length;
        if (currentMasterCount >= MAX_MASTER_ADMINS) {
          setRoleChangeError(`❌ Maximum ${MAX_MASTER_ADMINS} Admins allowed.`);
          setRoleChangeSubmitting(false);
          return;
        }
      }
      // Demoting an Admin also requires PIN
      if (roleChangeTarget.role === 'master_admin' && roleChangeTo !== 'master_admin') {
        if (!checkIsValidSecurityPinOrPhone(roleChangePin)) {
          setRoleChangeError('❌ Security PIN required to demote an Admin.');
          setRoleChangeSubmitting(false);
          return;
        }
      }
      // Cannot change primary admin role
      if (roleChangeTarget.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setRoleChangeError('❌ Primary Admin role cannot be changed.');
        setRoleChangeSubmitting(false);
        return;
      }

      const docId = roleChangeTarget.email.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      
      // Best-effort Firestore write
      try {
        await setDoc(doc(db, 'admins', docId), { role: roleChangeTo }, { merge: true });
      } catch (fsErr) {
        console.warn('Firestore role update skipped (localStorage fallback active):', fsErr);
      }

      // Always update localStorage
      try {
        const saved = localStorage.getItem('malik_admin_accounts_v1');
        const existing: AdminAccount[] = saved ? JSON.parse(saved) : [];
        const updated = existing.map((a) =>
          a.email.toLowerCase() === roleChangeTarget.email.toLowerCase()
            ? { ...a, role: roleChangeTo }
            : a
        );
        localStorage.setItem('malik_admin_accounts_v1', JSON.stringify(updated));
      } catch (e) {}

      // Update local state
      setAdminAccounts((prev) =>
        prev.map((a) =>
          a.email.toLowerCase() === roleChangeTarget.email.toLowerCase()
            ? { ...a, role: roleChangeTo }
            : a
        )
      );
      setRoleChangeTarget(null);
      setRoleChangePin('');
      setRoleChangeTo('staff');
    } catch (err: any) {
      setRoleChangeError(err.message || 'Failed to update role.');
    } finally {
      setRoleChangeSubmitting(false);
    }
  };

  const handleRemoveAdmin = async (email: string) => {
    const cleanTargetEmail = email.toLowerCase();
    if (!isMasterAdmin) {
      alert('Only Primary Admin can remove admin accounts.');
      return;
    }

    if (cleanTargetEmail === ADMIN_EMAIL.toLowerCase()) {
      alert('The Primary Admin account cannot be removed.');
      return;
    }

    if (!window.confirm(`Are you sure you want to revoke admin access for ${email}?`)) return;

    try {
      const docId = cleanTargetEmail.replace(/[^a-zA-Z0-9]/g, '_');

      // Best-effort Firestore delete
      try {
        await deleteDoc(doc(db, 'admins', docId));
      } catch (fsErr) {
        console.warn('Firestore deletion skipped (localStorage fallback active):', fsErr);
      }

      // Always update localStorage
      try {
        const saved = localStorage.getItem('malik_admin_accounts_v1');
        if (saved) {
          const existing: AdminAccount[] = JSON.parse(saved);
          const filtered = existing.filter((a) => a.email.toLowerCase() !== cleanTargetEmail);
          localStorage.setItem('malik_admin_accounts_v1', JSON.stringify(filtered));
        }
      } catch (e) {}

      // Update local state
      setAdminAccounts((prev) => prev.filter((a) => a.email.toLowerCase() !== cleanTargetEmail));
    } catch (err: any) {
      console.error('Failed to remove admin:', err);
    }
  };

  // Handle Admin Sign In
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginSuccess('');
    setLoginSubmitting(true);

    try {
      const cleanEmail = adminEmail.trim().toLowerCase();
      const isMasterVariant = cleanEmail.startsWith('shashankpawar0113@gmail') || cleanEmail === ADMIN_EMAIL.toLowerCase();
      const isTeamAdmin = adminAccounts.some((a) => a.email.toLowerCase() === cleanEmail);

      if (!isMasterVariant && !isTeamAdmin) {
        throw new Error('Access Denied. Only authorized Admin email accounts can log into the Admin Portal.');
      }
      await signIn(adminEmail.trim(), adminPassword);
    } catch (err: any) {
      console.error('Admin login error:', err);
      setLoginError(err.message || 'Invalid admin email or password.');
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Handle Admin Google Sign In
  const handleAdminGoogleSignIn = async () => {
    setLoginError('');
    setLoginSuccess('');
    setLoginSubmitting(true);
    try {
      await signInWithGoogle();
      const gUser = auth.currentUser;
      const gEmail = gUser?.email?.toLowerCase() || '';

      const isMasterVariant = gEmail.startsWith('shashankpawar0113@gmail') || gEmail === ADMIN_EMAIL.toLowerCase();
      const isTeamAdmin = adminAccounts.some((a) => a.email.toLowerCase() === gEmail);

      if (!isMasterVariant && !isTeamAdmin && !isAdmin) {
        try { localStorage.removeItem('malik_admin_session_v1'); } catch (e) {}
        throw new Error(`Access Denied: Google account "${gEmail || 'User'}" is not an authorized Admin.`);
      }

      try { localStorage.setItem('malik_admin_session_v1', 'true'); } catch (e) {}
      setLoginSuccess('✅ Google Admin Authentication successful!');
    } catch (err: any) {
      console.error('Admin Google sign in error:', err);
      setLoginError(err.message || 'Google Admin Sign In failed.');
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

  const checkIsValidSecurityPinOrPhone = (inputVal: string): boolean => {
    const rawInput = inputVal.trim();
    const cleanDigits = inputVal.replace(/\D/g, '');

    let customPin = '';
    let customPhone = '';
    try {
      customPin = localStorage.getItem('malik_admin_pin_v1') || '';
      customPhone = localStorage.getItem('malik_admin_security_phone_v1') || '';
    } catch (e) {}

    // Check custom saved PIN or Phone
    if (customPin && rawInput === customPin) return true;
    if (customPhone && (rawInput === customPhone || cleanDigits === customPhone.replace(/\D/g, ''))) return true;

    // Default PIN: 0113 or 011300
    if (rawInput === '0113' || rawInput === '011300') return true;
    // Default Phone: 9318446981 (or legacy 7078523738)
    if (cleanDigits === '9318446981' || rawInput === '9318446981' || cleanDigits === '7078523738' || rawInput === '7078523738') return true;

    return false;
  };

  const handleInstantPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetModalError('');
    setResetModalSuccess('');

    const targetEmail = resetTargetEmail.trim().toLowerCase();
    const cleanPin = resetSecurityPin.trim();

    if (!targetEmail || !targetEmail.includes('@')) {
      setResetModalError('Please enter a valid Admin Email Address.');
      return;
    }

    if (!checkIsValidSecurityPinOrPhone(cleanPin)) {
      setResetModalError('Incorrect Master Security PIN or Registered Phone Number.');
      return;
    }

    if (!resetNewPassword || resetNewPassword.length < 4) {
      setResetModalError('New password must be at least 4 characters long.');
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      setResetModalError('New passwords do not match. Please re-enter carefully.');
      return;
    }

    setResetSubmitting(true);
    try {
      const isMasterVariant =
        targetEmail.startsWith('shashankpawar0113@gmail') || targetEmail === ADMIN_EMAIL.toLowerCase();

      if (isMasterVariant) {
        localStorage.setItem('malik_admin_password_v1', resetNewPassword);
        try {
          await setDoc(
            doc(db, 'system', 'admin_config'),
            { masterPassword: resetNewPassword, updatedAt: new Date().toISOString() },
            { merge: true }
          );
        } catch (e) {}
      } else {
        // Reset password for specific team admin account
        const docId = targetEmail.replace(/[^a-zA-Z0-9]/g, '_');
        const adminDocRef = doc(db, 'admins', docId);

        await setDoc(
          adminDocRef,
          {
            email: targetEmail,
            password: resetNewPassword,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

        setAdminAccounts((prev) =>
          prev.map((acc) => (acc.email.toLowerCase() === targetEmail ? { ...acc, password: resetNewPassword } : acc))
        );
      }

      setResetModalSuccess(`✅ Password updated successfully for ${targetEmail}! You can now log in using your new password.`);
      if (adminEmail.trim().toLowerCase() === targetEmail) {
        setAdminPassword(resetNewPassword);
      }
      setTimeout(() => {
        setIsResetModalOpen(false);
      }, 1800);
    } catch (err: any) {
      setResetModalError(err.message || 'Failed to update password.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleChangeSecurityCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityModalError('');
    setSecurityModalSuccess('');

    // Verification of Old PIN / Phone before changing!
    if (!checkIsValidSecurityPinOrPhone(currentSecurityPin)) {
      setSecurityModalError('Current Security PIN or Phone is incorrect. Verification failed.');
      return;
    }

    if (!newSecurityPin.trim() && !newSecurityPhone.trim()) {
      setSecurityModalError('Please enter a new Security PIN or a new Registered Phone Number.');
      return;
    }

    setSecuritySubmitting(true);
    try {
      if (newSecurityPin.trim()) {
        localStorage.setItem('malik_admin_pin_v1', newSecurityPin.trim());
      }
      if (newSecurityPhone.trim()) {
        const cleanPhone = newSecurityPhone.replace(/\D/g, '');
        localStorage.setItem('malik_admin_security_phone_v1', cleanPhone || newSecurityPhone.trim());
      }

      try {
        await setDoc(doc(db, 'system', 'admin_security'), {
          securityPin: newSecurityPin.trim() || undefined,
          securityPhone: newSecurityPhone.trim() || undefined,
          updatedAt: new Date().toISOString(),
          updatedBy: currentUser?.email || 'admin'
        }, { merge: true });
      } catch (e) {}

      setSecurityModalSuccess('✅ Master Security PIN & Registered Phone Number updated successfully!');
      setTimeout(() => {
        setIsSecuritySettingsModalOpen(false);
        setCurrentSecurityPin('');
        setNewSecurityPin('');
        setNewSecurityPhone('');
      }, 1800);
    } catch (err: any) {
      setSecurityModalError(err.message || 'Failed to update security credentials.');
    } finally {
      setSecuritySubmitting(false);
    }
  };



  // Update Booking Status
  const handleUpdateStatus = async (orderId: string, userId: string, newStatus: OrderRecord['status']) => {
    setUpdatingOrderId(orderId);

    // Optimistically update local state immediately
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );

    try {
      // 1. Update in global orders collection
      const globalDocRef = doc(db, 'orders', orderId);
      await setDoc(globalDocRef, { status: newStatus }, { merge: true });

      // 2. Update in user's orders subcollection if userId exists
      if (userId) {
        try {
          const userDocRef = doc(db, 'users', userId, 'orders', orderId);
          await setDoc(userDocRef, { status: newStatus }, { merge: true });
        } catch (e) {}
      }
    } catch (e) {
      console.error('Failed to update order status in Firestore:', e);
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

  const renderResetModal = () => {
    if (!isResetModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Instant Admin Password Reset</h3>
                <p className="text-[11px] text-slate-400">Reset password directly using Master Security PIN</p>
              </div>
            </div>
            <button onClick={() => setIsResetModalOpen(false)} className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleInstantPasswordReset} className="space-y-4">
            {resetModalError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{resetModalError}</span>
              </div>
            )}

            {resetModalSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{resetModalSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Admin Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                required
                placeholder="Enter admin email to reset password for"
                value={resetTargetEmail}
                onChange={(e) => setResetTargetEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Which admin account are you resetting the password for?</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Master Security PIN / Registered Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter Master Security PIN or Registered Phone"
                value={resetSecurityPin}
                onChange={(e) => setResetSecurityPin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                New Admin Password
              </label>
              <input
                type="password"
                required
                placeholder="Enter your new password"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                placeholder="Re-enter your new password"
                value={resetConfirmPassword}
                onChange={(e) => setResetConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={resetSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-md disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {resetSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>Update Password</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  const renderSecuritySettingsModal = () => {
    if (!isSecuritySettingsModalOpen) return null;
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Change Security PIN & Registered Phone</h3>
                <p className="text-[11px] text-slate-400">Update your security credentials used for password resets</p>
              </div>
            </div>
            <button
              onClick={() => setIsSecuritySettingsModalOpen(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleChangeSecurityCredentials} className="space-y-4">
            {securityModalError && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{securityModalError}</span>
              </div>
            )}

            {securityModalSuccess && (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <span>{securityModalSuccess}</span>
              </div>
            )}

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1">
              <div className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Security Verification Step</span>
              </div>
              <p className="text-[11px] text-slate-400">
                You must enter your current Security PIN or current Registered Phone number to authorize changes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Current Security PIN / Phone <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Enter current Security PIN or Phone"
                value={currentSecurityPin}
                onChange={(e) => setCurrentSecurityPin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="border-t border-slate-800 pt-3 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  New Master Security PIN
                </label>
                <input
                  type="text"
                  placeholder="Enter new PIN (e.g. 4321)"
                  value={newSecurityPin}
                  onChange={(e) => setNewSecurityPin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  New Registered Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter new 10-digit phone (e.g. 9318446981)"
                  value={newSecurityPhone}
                  onChange={(e) => setNewSecurityPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsSecuritySettingsModalOpen(false)}
                className="w-1/3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={securitySubmitting}
                className="w-2/3 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-md disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                {securitySubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                )}
                <span>Save Credentials</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  // Show spinner only if Firebase auth is still loading AND no local admin session exists.
  // If localStorage has a valid admin session, skip the spinner entirely.
  if (authLoading && !isAdminSessionActive) {
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
  // Allow access if: local admin session exists OR Firebase confirms admin role.
  const hasAdminAccess = isAdminSessionActive || (!!currentUser && isAdmin);
  if (!hasAdminAccess) {
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
                  onClick={() => {
                    setResetTargetEmail('');
                    setResetModalError('');
                    setResetModalSuccess('');
                    setIsResetModalOpen(true);
                  }}
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

            {/* DIVIDER */}
            <div className="flex items-center gap-3 my-2">
              <div className="flex-1 h-px bg-slate-800" />
              <span className="text-[10px] text-slate-500 font-medium uppercase">or</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {/* GOOGLE ADMIN SIGN IN */}
            <button
              type="button"
              onClick={handleAdminGoogleSignIn}
              disabled={loginSubmitting}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2.5 shadow-sm border border-slate-700 disabled:opacity-50 transition-all"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Sign In with Google (Admin)</span>
            </button>
          </form>

          <div className="pt-4 border-t border-slate-800 text-center">
            <a href="/" className="text-xs font-medium text-slate-400 hover:text-emerald-400 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Customer Storefront
            </a>
          </div>
        </div>

        {renderResetModal()}
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
              <p className="text-xs text-slate-400 hidden sm:block">Logged in as {currentUser?.email ?? ADMIN_EMAIL}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-xs font-bold text-purple-300 border border-purple-500/40 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admins ({adminAccounts.length})</span>
            </button>

            <button
              onClick={() => {
                setSecurityModalError('');
                setSecurityModalSuccess('');
                setIsSecuritySettingsModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-xs font-bold text-amber-300 border border-amber-500/40 transition-colors"
              title="Change Master Security PIN & Phone"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Security PIN</span>
            </button>

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Total Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            {canViewRevenue ? (
              <>
                <div className="text-xl font-black text-emerald-400 font-mono">
                  ₹{metrics.totalRev.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500">From all bookings</div>
              </>
            ) : (
              <>
                <div className="text-xl font-black text-slate-600 font-mono flex items-center gap-1">
                  <Lock className="w-4 h-4" /> ••••••
                </div>
                <div className="text-[10px] text-slate-500">Admin role only</div>
              </>
            )}
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

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Delivered</span>
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono">{metrics.deliveredCount}</div>
            <div className="text-[10px] text-slate-500">Completed bookings</div>
          </div>

          <div
            onClick={() => setIsAdminModalOpen(true)}
            className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1 shadow-sm cursor-pointer hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Admin Users</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-400 font-mono">{adminAccounts.length} Active</div>
            <div className="text-[10px] text-emerald-400 font-bold flex items-center justify-between">
              <span>Add / Remove</span>
              <span>→</span>
            </div>
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

          {ordersError && (
            <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-xs text-red-300 font-medium">{ordersError}</p>
              <button
                onClick={fetchAllOrders}
                className="mt-2 text-xs text-red-400 underline hover:text-red-200"
              >
                Retry
              </button>
            </div>
          )}

          {loadingOrders ? (
            <div className="p-12 text-center space-y-3">
              <div className="inline-block animate-spin rounded-full h-7 w-7 border-2 border-emerald-400 border-t-transparent" />
              <p className="text-xs text-slate-400">Fetching latest bookings from Firebase...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Package className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-300 text-sm">
                {statusFilter !== 'All' ? `No ${statusFilter} Bookings Found` : 'No Bookings Found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                {searchQuery
                  ? `No orders match "${searchQuery}". Try clearing your search.`
                  : statusFilter !== 'All'
                  ? `You currently have 0 orders marked as "${statusFilter}". Click below to view all customer orders.`
                  : 'No customer bookings match your current view.'}
              </p>
              {(statusFilter !== 'All' || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter('All');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                >
                  Reset Filter & View All ({orders.length} Total Orders)
                </button>
              )}
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
                          value={order.status || 'Processing'}
                          disabled={updatingOrderId === order.id}
                          onChange={(e) =>
                            handleUpdateStatus(order.id, order.userId, e.target.value as OrderRecord['status'])
                          }
                          className={`appearance-none font-bold text-xs px-3 py-1.5 pr-7 rounded-lg border focus:outline-none transition-colors cursor-pointer ${
                            order.status === 'Processing'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : order.status === 'Confirmed'
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : order.status === 'Dispatched'
                              ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                              : order.status === 'Delivered'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border-red-500/40'
                          }`}
                        >
                          <option value="Processing" className="bg-slate-900 text-amber-300 font-bold py-1">Processing</option>
                          <option value="Confirmed" className="bg-slate-900 text-blue-300 font-bold py-1">Confirmed</option>
                          <option value="Dispatched" className="bg-slate-900 text-purple-300 font-bold py-1">Dispatched</option>
                          <option value="Delivered" className="bg-slate-900 text-emerald-300 font-bold py-1">Delivered</option>
                          <option value="Cancelled" className="bg-slate-900 text-red-300 font-bold py-1">Cancelled</option>
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

      {/* MANAGE AUTHORIZED ADMIN ACCOUNTS MODAL */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* MODAL HEADER */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Manage Authorized Admins</h3>
                  <p className="text-xs text-slate-400">{adminAccounts.length} active admin user accounts</p>
                </div>
              </div>
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* ADD NEW ADMIN FORM (MASTER ADMIN ONLY) */}
              {isMasterAdmin ? (
                <form onSubmit={handleAddAdmin} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                  <div className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Add Authorized Admin Account</span>
                  </div>

                  {adminError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/30 text-red-300 rounded-lg text-xs font-medium">
                      {adminError}
                    </div>
                  )}

                  {adminSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-medium">
                      {adminSuccess}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Admin Full Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Alex Sharma"
                          value={newAdminName}
                          onChange={(e) => setNewAdminName(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Admin Email Address <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="admin@malik.com"
                          value={newAdminEmail}
                          onChange={(e) => setNewAdminEmail(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">
                        Assign Admin Password <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Set unique password for this admin account"
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    {/* ROLE SELECTOR */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1.5">
                        Assign Role <span className="text-red-400">*</span>
                      </label>
                      <div className="flex gap-2">
                        {(['staff', 'member', 'master_admin'] as AdminAccount['role'][]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setNewAdminRole(r)}
                            className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-colors ${
                              newAdminRole === r
                                ? ROLE_COLORS[r] + ' border-current'
                                : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-500'
                            }`}
                          >
                            {ROLE_LABELS[r]}
                          </button>
                        ))}
                      </div>
                      {newAdminRole === 'master_admin' && (
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Enter Master Security PIN / Phone to confirm"
                            value={newAdminMasterPin}
                            onChange={(e) => setNewAdminMasterPin(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-900 border border-purple-500/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                          />
                          <p className="text-[10px] text-purple-400 mt-1">⚠️ Master Admin can view revenue. Max 3 allowed.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminSubmitting}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {adminSubmitting ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                    <span>Add Admin as {ROLE_LABELS[newAdminRole]}</span>
                  </button>
                </form>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Only Primary Master Admin ({ADMIN_EMAIL}) can add or remove admin accounts.</span>
                </div>
              )}

              {/* ADMIN ACCOUNTS LIST */}
              <div className="space-y-3">
                <div className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                  Active Admin Accounts ({adminAccounts.length})
                </div>

                <div className="space-y-2">
                  {adminAccounts.map((acc) => {
                    const isPrimary = acc.email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
                    return (
                      <div
                        key={acc.id}
                        className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            {acc.name?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-xs text-white truncate">{acc.name || acc.email}</span>
                              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS[acc.role] || 'bg-slate-700 text-slate-300 border-slate-600'}`}>
                                {ROLE_LABELS[acc.role] || acc.role}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">{acc.email}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Change Role button — only master admin, not for primary */}
                          {isMasterAdmin && !isPrimary && (
                            <button
                              onClick={() => {
                                setRoleChangeTarget(acc);
                                setRoleChangeTo(acc.role);
                                setRoleChangePin('');
                                setRoleChangeError('');
                              }}
                              className="px-2 py-1 text-[10px] font-bold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
                              title="Change Role"
                            >
                              Change Role
                            </button>
                          )}
                          {isMasterAdmin && !isPrimary ? (
                            <button
                              onClick={() => handleRemoveAdmin(acc.email)}
                              className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/30"
                              title="Revoke Admin Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-500 px-2 py-1 bg-slate-900 rounded border border-slate-800">
                              {isPrimary ? 'Primary' : 'Protected'}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ROLE CHANGE MODAL */}
      {roleChangeTarget && (
        <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Change Role</h3>
              <button onClick={() => setRoleChangeTarget(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Changing role for <span className="text-white font-bold">{roleChangeTarget.email}</span>
            </p>

            {/* Role selector */}
            <div className="flex gap-2">
              {(['staff', 'member', 'master_admin'] as AdminAccount['role'][]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoleChangeTo(r)}
                  className={`flex-1 py-2 rounded-lg text-[11px] font-bold border transition-colors ${
                    roleChangeTo === r
                      ? ROLE_COLORS[r] + ' border-current'
                      : 'bg-slate-800 text-slate-500 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  {ROLE_LABELS[r]}
                </button>
              ))}
            </div>

            {/* PIN required for master_admin assignment or demotion */}
            {(roleChangeTo === 'master_admin' || roleChangeTarget.role === 'master_admin') && (
              <div>
                <input
                  type="text"
                  placeholder="Security PIN / Phone required"
                  value={roleChangePin}
                  onChange={(e) => setRoleChangePin(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-purple-500/50 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
                />
                <p className="text-[10px] text-purple-400 mt-1">
                  {roleChangeTo === 'master_admin'
                    ? '⚠️ Admin role requires PIN verification.'
                    : '⚠️ Demoting an Admin requires PIN verification.'}
                </p>
              </div>
            )}

            {roleChangeError && (
              <p className="text-xs text-red-400 font-medium">{roleChangeError}</p>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setRoleChangeTarget(null)}
                className="flex-1 py-2 text-xs font-bold text-slate-400 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeAdminRole}
                disabled={roleChangeSubmitting}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {roleChangeSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                Save Role
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INSTANT ADMIN PASSWORD RESET MODAL */}
      {renderResetModal()}

      {/* SECURITY CREDENTIALS MANAGEMENT MODAL */}
      {renderSecuritySettingsModal()}
    </div>
  );
}
