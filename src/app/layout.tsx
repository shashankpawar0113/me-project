import type { Metadata } from 'next';
import './globals.css';
import { InventoryProvider } from '@/context/InventoryContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'Malik Enterprises | Quality Refurbished Goods, Unbeatable Prices',
  description: 'Shop pre-owned electronics, furniture, and more. Direct delivery, order via WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#f9f9ff] text-[#161c27]">
        <AuthProvider>
          <CartProvider>
            <InventoryProvider>
              {children}
            </InventoryProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

