import type { Metadata } from 'next';
import './globals.css';
import { InventoryProvider } from '@/context/InventoryContext';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';

export const metadata: Metadata = {
  title: 'Malik Enterprises | Quality Goods, Unbeatable Prices',
  description: 'Shop pre-owned electronics, furniture, and more. Direct delivery, order via WhatsApp.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
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

