export type ProductCondition = 'LIKE NEW' | 'REFURBISHED' | 'EXCELLENT' | 'FAIR';

export type ProductStatus = 'Available' | 'Sold';

export interface Product {
  id: string;
  title: string;
  mrp: number;
  sellingPrice: number;
  condition: ProductCondition | string;
  status: ProductStatus;
  category: string;
  images: string[];
  description?: string;
  quantity?: number;
  createdAt: string;
}

export type ActiveTab = 'shop' | 'categories' | 'orders' | 'account';
