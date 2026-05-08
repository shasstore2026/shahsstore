import { getCategories } from "@/lib/products";
import Link from "next/link";
import AdminCategoriesClient from "./AdminCategoriesClient";

export default async function AdminCategoriesPage() {
  const styles = await getCategories();

  return (
    <div>
      <div className="flex justify-between items-end mb-10">
        <div>
          <p className="text-xs tracking-[0.3em] text-stone-400 uppercase mb-2">Manage</p>
          <h1 className="text-4xl text-stone-900 font-light"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Categories
          </h1>
        </div>
        <Link
          href="/shasstorebyshahanas/categories/new"
          className="bg-stone-900 text-white px-6 py-3 text-xs tracking-widest uppercase hover:bg-stone-700 transition-all"
        >
          + Add Style
        </Link>
      </div>

      <AdminCategoriesClient styles={styles} />
    </div>
  );
}
