import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { Product } from '@/types/product';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'products.json');

// Helper to ensure data directory and file exist
async function getProductsFromFile(): Promise<Product[]> {
  try {
    const fileContent = await fs.readFile(DATA_FILE_PATH, 'utf-8');
    const parsed = JSON.parse(fileContent);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    // If directory or file doesn't exist, create it
    const dataDir = path.dirname(DATA_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    const emptyInventory: Product[] = [];
    await fs.writeFile(DATA_FILE_PATH, JSON.stringify(emptyInventory, null, 2), 'utf-8');
    return emptyInventory;
  }
}

// Helper to write products to file
async function saveProductsToFile(products: Product[]): Promise<void> {
  const dataDir = path.dirname(DATA_FILE_PATH);
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(DATA_FILE_PATH, JSON.stringify(products, null, 2), 'utf-8');
}

// GET /api/products
export async function GET() {
  try {
    const products = await getProductsFromFile();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products (Add product)
export async function POST(request: Request) {
  try {
    const newProdData = await request.json();
    const existingProducts = await getProductsFromFile();

    const nextIdNumber =
      existingProducts.reduce((max, p) => {
        const num = parseInt(p.id.replace(/\D/g, ''), 10);
        return !isNaN(num) && num > max ? num : max;
      }, 100) + 1;

    const finalId = newProdData.id?.trim() || `PRD-${nextIdNumber}`;

    const newProduct: Product = {
      ...newProdData,
      id: finalId,
      createdAt: new Date().toISOString(),
    };

    const updatedProducts = [newProduct, ...existingProducts];
    await saveProductsToFile(updatedProducts);

    return NextResponse.json({ success: true, product: newProduct, products: updatedProducts }, { status: 201 });
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

// PATCH /api/products (Update product / Toggle status)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, ...otherUpdates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const existingProducts = await getProductsFromFile();
    const updatedProducts = existingProducts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          ...otherUpdates,
          status: status !== undefined ? status : p.status,
        };
      }
      return p;
    });

    await saveProductsToFile(updatedProducts);
    return NextResponse.json({ success: true, products: updatedProducts });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products (Delete product)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      const body = await request.json().catch(() => ({}));
      id = body.id;
    }

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    const existingProducts = await getProductsFromFile();
    const updatedProducts = existingProducts.filter((p) => p.id !== id);

    await saveProductsToFile(updatedProducts);
    return NextResponse.json({ success: true, products: updatedProducts });
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
  }
}
