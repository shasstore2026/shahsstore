import { getProducts } from "@/lib/products";
import Link from "next/link";
import AdminProductsClient from "./AdminProductsClient";

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Manage</p>
          <h1
            className="text-4xl text-stone-900 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            All Products
          </h1>
        </div>
        <Link
          href="/shasstorebyshahanas/products/new"
          className="bg-stone-900 text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-stone-700 transition-all"
        >
          + Add Product
        </Link>
      </div>

      <AdminProductsClient products={products} />
    </div>
  );
}
