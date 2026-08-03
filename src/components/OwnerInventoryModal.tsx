'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useInventory } from '@/context/InventoryContext';
import { X, Plus, CheckCircle2, Ban, Trash2, RotateCcw, PackagePlus, ListFilter, UploadCloud, Tag, Lock, KeyRound, ShieldAlert, LogOut, PhoneCall, HelpCircle, ArrowLeft, ShieldCheck } from 'lucide-react';

interface OwnerInventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_SAMPLE_IMAGES = [
  { label: 'Office Chair', url: 'https://images.unsplash.com/photo-1505797149-43b0069ec26b?auto=format&fit=crop&w=800&q=80' },
  { label: 'Desk Monitor', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80' },
  { label: 'Oak Desk', url: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=800&q=80' },
  { label: 'Gas Arm Mount', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80' },
];

const OWNER_PASSWORD_KEY = 'malik_owner_password_v1';
const DEFAULT_PASSWORD = '1234';
const AUTHORIZED_OWNER_NUMBERS = ['9318446981', '7078523738'];

export const OwnerInventoryModal: React.FC<OwnerInventoryModalProps> = ({ isOpen, onClose }) => {
  const { products, addProduct, toggleSoldStatus, deleteProduct, resetToSeedData } = useInventory();
  const [activeTab, setActiveTab] = useState<'add' | 'list' | 'settings'>('add');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Authentication & Forgot Password State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [storedPassword, setStoredPassword] = useState(DEFAULT_PASSWORD);

  // Phone Verification & Reset Password State
  const [verifyPhoneInput, setVerifyPhoneInput] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetSuccessMessage, setResetSuccessMessage] = useState('');

  // Change Password State (when logged in)
  const [newPassword, setNewPassword] = useState('');
  const [changePasswordSuccess, setChangePasswordSuccess] = useState('');

  // Form State
  const [customId, setCustomId] = useState('');
  const [title, setTitle] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [mrp, setMrp] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [condition, setCondition] = useState('LIKE NEW');
  const [categorySelect, setCategorySelect] = useState('Furniture');
  const [customCategory, setCustomCategory] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Load stored owner password on mount
  useEffect(() => {
    try {
      const savedPass = localStorage.getItem(OWNER_PASSWORD_KEY);
      if (savedPass) {
        setStoredPassword(savedPass);
      } else {
        localStorage.setItem(OWNER_PASSWORD_KEY, DEFAULT_PASSWORD);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  if (!isOpen) return null;

  // Handle Login Authentication
  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let currentPass = storedPassword;
    try {
      const savedPass = localStorage.getItem(OWNER_PASSWORD_KEY);
      if (savedPass) {
        currentPass = savedPass;
      }
    } catch (e) {
      console.error(e);
    }

    if (passwordInput.trim() === currentPass) {
      setIsAuthenticated(true);
      setPasswordError('');
      setPasswordInput('');
    } else {
      setPasswordError('Incorrect password! Please try again or use Forgot Password.');
    }
  };

  // Handle Forgot Password Reset with Phone Verification
  const handleForgotResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    const cleanPhone = verifyPhoneInput.replace(/\D/g, '');
    const isValidOwner = AUTHORIZED_OWNER_NUMBERS.some((num) => cleanPhone.includes(num));

    if (!isValidOwner) {
      setPhoneError('Verification Failed! Password can only be changed if the authorized owner phone number is entered.');
      return;
    }

    if (!resetNewPassword.trim()) {
      setPhoneError('Please enter a new password.');
      return;
    }

    const nextPass = resetNewPassword.trim();
    setStoredPassword(nextPass);
    try {
      localStorage.setItem(OWNER_PASSWORD_KEY, nextPass);
    } catch (e) {
      console.error(e);
    }

    setResetSuccessMessage('Owner Phone Verified! Password updated & saved. Unlocking tools...');
    setTimeout(() => {
      setResetSuccessMessage('');
      setIsForgotPasswordMode(false);
      setIsAuthenticated(true);
      setResetNewPassword('');
      setVerifyPhoneInput('');
      setPhoneError('');
    }, 1200);
  };

  // Handle Changing Password (when logged in)
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) return;

    const nextPass = newPassword.trim();
    setStoredPassword(nextPass);
    try {
      localStorage.setItem(OWNER_PASSWORD_KEY, nextPass);
    } catch (e) {
      console.error(e);
    }

    setChangePasswordSuccess(`Password updated successfully! Your new login password is "${nextPass}".`);
    setNewPassword('');
    setTimeout(() => setChangePasswordSuccess(''), 3000);
  };

  // File Upload Handler (with canvas compression)
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert('Please upload valid image files.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const rawDataUrl = event.target.result as string;

          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            const scaleSize = MAX_WIDTH / img.width;
            const width = scaleSize < 1 ? MAX_WIDTH : img.width;
            const height = scaleSize < 1 ? img.height * scaleSize : img.height;

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.75);
              setUploadedImages((prev) => [...prev, compressedDataUrl]);
            } else {
              setUploadedImages((prev) => [...prev, rawDataUrl]);
            }
          };
          img.src = rawDataUrl;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customId.trim() || !title.trim() || !sellingPrice || !mrp || !quantity || !description.trim()) {
      alert('Please fill in Product ID, title, selling price, MRP, quantity, and description.');
      return;
    }

    const finalCategory =
      categorySelect === 'CUSTOM'
        ? customCategory.trim() || 'General'
        : categorySelect;

    let finalImages: string[] = [];
    if (uploadedImages.length > 0) {
      finalImages = uploadedImages;
    } else if (imageUrl.trim()) {
      finalImages = [imageUrl.trim()];
    } else {
      finalImages = [PRESET_SAMPLE_IMAGES[0].url];
    }

    const parsedQty = parseInt(quantity, 10) || 1;

    try {
      await addProduct({
        id: customId.trim() || undefined,
        title: title.trim(),
        sellingPrice: parseFloat(sellingPrice),
        mrp: parseFloat(mrp),
        quantity: parsedQty,
        condition,
        status: parsedQty <= 0 ? 'Sold' : 'Available',
        category: finalCategory,
        images: finalImages,
        description: description.trim(),
      });

      setSuccessMessage(`Successfully published "${title}" (Qty: ${parsedQty}) under category "${finalCategory}"!`);

      // Reset form fields
      setCustomId('');
      setTitle('');
      setSellingPrice('');
      setMrp('');
      setQuantity('1');
      setDescription('');
      setUploadedImages([]);
      setImageUrl('');
      setCustomCategory('');
      setCategorySelect('Furniture');

      setTimeout(() => {
        setSuccessMessage('');
        setActiveTab('list');
      }, 1500);
    } catch (error) {
      console.error('Failed to add product:', error);
      alert('Failed to add product. Please check your internet connection and Firestore permissions, then try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden z-10 my-6 border border-slate-200 text-slate-900 flex flex-col">
        {/* MODAL HEADER */}
        <div className="bg-[#043d27] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-emerald-300" />
            <div>
              <h2 className="font-bold text-lg">Owner Inventory Manager</h2>
              <p className="text-xs text-emerald-200">
                {isAuthenticated
                  ? 'Authenticated Owner Access'
                  : isForgotPasswordMode
                  ? 'Owner Phone Verification Mode'
                  : 'Security Lock Enabled'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setIsAuthenticated(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Lock Tool"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FORGOT PASSWORD RESET SCREEN WITH PHONE VERIFICATION */}
        {!isAuthenticated && isForgotPasswordMode ? (
          <div className="p-8 text-center space-y-5 max-w-md mx-auto my-4 animate-fadeIn">
            <button
              onClick={() => {
                setIsForgotPasswordMode(false);
                setPhoneError('');
              }}
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Login</span>
            </button>

            <div className="w-14 h-14 rounded-full bg-emerald-50 text-[#043d27] border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-lg">Owner Phone Verification</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your registered owner phone number to verify identity and reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotResetSubmit} className="space-y-3.5 text-left">
              {phoneError && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{phoneError}</span>
                </div>
              )}

              {resetSuccessMessage && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{resetSuccessMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  placeholder="Enter phone number"
                  value={verifyPhoneInput}
                  onChange={(e) => setVerifyPhoneInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#043d27] font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  New Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter new password"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#043d27] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#043d27] hover:bg-[#002b1b] text-white text-xs font-bold rounded flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <KeyRound className="w-4 h-4" />
                <span>Verify Phone no. & Reset Password</span>
              </button>
            </form>
          </div>
        ) : !isAuthenticated ? (
          /* AUTHENTICATION LOCK SCREEN */
          <div className="p-8 text-center space-y-6 max-w-md mx-auto my-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-[#043d27] flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="font-bold text-slate-900 text-lg">Owner Password Required</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Please enter your owner password to manage inventory, add products, or change sold out status.
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-3 text-left">
              {passwordError && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-xs font-semibold flex items-center gap-2 border border-red-200">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Enter Password
                </label>
                <input
                  type="password"
                  autoFocus
                  required
                  placeholder="Enter owner password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded text-sm text-slate-900 focus:outline-none focus:border-[#043d27] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-[#043d27] hover:bg-[#002b1b] text-white text-xs font-bold rounded flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Unlock Owner Tools</span>
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Malik Enterprises Security</span>
              <button
                onClick={() => {
                  setIsForgotPasswordMode(true);
                  setPasswordError('');
                }}
                className="text-[#043d27] font-bold hover:underline flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Forgot Password?</span>
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* TABS */}
            <div className="flex border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setActiveTab('add')}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'add'
                    ? 'border-[#043d27] text-[#043d27] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <PackagePlus className="w-4 h-4" />
                <span>Add Product</span>
              </button>

              <button
                onClick={() => setActiveTab('list')}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'list'
                    ? 'border-[#043d27] text-[#043d27] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Manage ({products.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className={`py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                  activeTab === 'settings'
                    ? 'border-[#043d27] text-[#043d27] bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Password</span>
              </button>
            </div>

            {/* TAB 1: ADD NEW PRODUCT FORM */}
            {activeTab === 'add' && (
              <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                {successMessage && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* UPLOAD PHOTOS */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Upload Product Photos *
                  </label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-[#043d27] bg-slate-50 hover:bg-emerald-50/50 rounded-xl p-4 text-center cursor-pointer transition-colors space-y-1"
                  >
                    <UploadCloud className="w-8 h-8 text-[#043d27] mx-auto" />
                    <div className="font-bold text-xs text-slate-800">
                      Click or tap to upload photos from phone / computer
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Supports JPG, PNG, WEBP (Select multiple photos)
                    </div>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-[11px] font-bold text-slate-600">
                        Uploaded Photos ({uploadedImages.length}):
                      </div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {uploadedImages.map((img, idx) => (
                          <div key={idx} className="relative w-16 h-16 rounded border border-slate-200 overflow-hidden shrink-0 group">
                            <img src={img} alt="" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(idx)}
                              className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-90 hover:opacity-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PRD-101 or ME-01"
                      value={customId}
                      onChange={(e) => setCustomId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27] font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Product Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Executive Mesh Office Chair"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4000"
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Original MRP (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 7000"
                      value={mrp}
                      onChange={(e) => setMrp(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Available Quantity *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 1, 5, 10"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27] font-semibold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Condition Tag *
                    </label>
                    <select
                      required
                      value={condition}
                      onChange={(e) => setCondition(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    >
                      <option value="LIKE NEW">LIKE NEW</option>
                      <option value="REFURBISHED">REFURBISHED</option>
                      <option value="EXCELLENT">EXCELLENT</option>
                      <option value="FAIR">FAIR</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Category *
                    </label>
                    <select
                      required
                      value={categorySelect}
                      onChange={(e) => setCategorySelect(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    >
                      <option value="Furniture">Furniture</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Accessories">Accessories</option>
                      <option value="Appliances">Appliances</option>
                      <option value="CUSTOM">+ Add Custom Category...</option>
                    </select>
                  </div>
                </div>

                {categorySelect === 'CUSTOM' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded space-y-1 animate-fadeIn">
                    <label className="block text-xs font-bold text-[#043d27] flex items-center gap-1">
                      <Tag className="w-3.5 h-3.5" />
                      <span>Write Custom Category Name *</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Smartphones, Lighting, Gaming, Sofas..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                    />
                  </div>
                )}

                <div className="pt-1 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">
                    Or Paste Image URL / Choose Sample Preset <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27] mb-2"
                  />
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">Presets:</span>
                    {PRESET_SAMPLE_IMAGES.map((sample, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImageUrl(sample.url)}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-medium shrink-0"
                      >
                        {sample.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Description / Specs *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Details like dimensions, warranty, sanitization..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-[#043d27] hover:bg-[#002b1b] text-white text-xs font-bold rounded flex items-center justify-center gap-2 shadow-xs transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Product to Catalog</span>
                </button>
              </form>
            )}

            {/* TAB 2: MANAGE INVENTORY */}
            {activeTab === 'list' && (
              <div className="p-6 space-y-3 max-h-[75vh] overflow-y-auto">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">
                    Click any item below to toggle Sold Out status or delete.
                  </span>
                  <button
                    onClick={resetToSeedData}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                    title="Reset catalog to sample items"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Sample Items</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {products.map((item) => {
                    const isSold = item.status === 'Sold';
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded bg-slate-50 border border-slate-200 gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.images[0]}
                            alt=""
                            className="w-12 h-12 rounded object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-slate-900 truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              <span className="font-bold text-[#043d27]">₹{item.sellingPrice}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 bg-emerald-100 text-[#043d27] rounded text-[10px] font-bold">{item.category}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => toggleSoldStatus(item.id)}
                            className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors ${
                              isSold
                                ? 'bg-slate-200 text-slate-700 hover:bg-[#8ef5b5] hover:text-[#007243]'
                                : 'bg-[#8ef5b5] text-[#007243] hover:bg-slate-200 hover:text-slate-700'
                            }`}
                          >
                            {isSold ? (
                              <>
                                <Ban className="w-3.5 h-3.5" />
                                <span>Mark Available</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Mark Sold Out</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() => deleteProduct(item.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: PASSWORD SETTINGS */}
            {activeTab === 'settings' && (
              <form onSubmit={handleChangePassword} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
                <div className="space-y-1">
                  <h3 className="font-bold text-slate-900 text-sm">Change Owner Password</h3>
                  <p className="text-xs text-slate-500">
                    Set a new password to protect your catalog tools.
                  </p>
                </div>

                {changePasswordSuccess && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 rounded font-semibold text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>{changePasswordSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    New Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-xs text-slate-900 focus:outline-none focus:border-[#043d27] font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#043d27] hover:bg-[#002b1b] text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Save New Password</span>
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
};
