"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { deleteCategory } from "@/lib/actions";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { useToast } from "@/components/admin/Toast";

type Style = {
  id: string;
  name: string;
  description: string;
  image: string;
  display_order: number;
};

export default function AdminCategoriesClient({ styles }: { styles: Style[] }) {
  const router = useRouter();
  const toast = useToast();
  const [deleteTarget, setDeleteTarget] = useState<Style | null>(null);

  return (
    <>
      <div className="bg-white border border-stone-100 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-stone-50 border-b border-stone-100">
            <tr>
              {["Image", "Name", "Description", "Order", "Actions"].map((h) => (
                <th key={h} className="text-left px-6 py-4 text-xs tracking-widest uppercase text-stone-400 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {styles.map((style) => (
              <tr key={style.id} className="hover:bg-stone-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="relative w-12 h-12 bg-stone-100 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={style.image} alt={style.name} className="w-full h-full object-cover" />
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-stone-800 font-medium">{style.name}</td>
                <td className="px-6 py-4 text-sm text-stone-400">{style.description}</td>
                <td className="px-6 py-4 text-sm text-stone-600">{style.display_order}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-3">
                    <Link
                      href={`/shasstorebyshahanas/categories/${style.id}`}
                      className="text-xs text-stone-500 hover:text-stone-900 underline underline-offset-4"
                    >
                      Edit
                    </Link>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(style)}
                      className="text-xs text-red-400 hover:text-red-600 underline underline-offset-4"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DeleteConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async (phrase) => {
          if (!deleteTarget) return;
          const name = deleteTarget.name;
          await deleteCategory(deleteTarget.id, phrase);
          toast.success("Style deleted", `"${name}" has been removed.`);
          setDeleteTarget(null);
          router.refresh();
        }}
        title={deleteTarget?.name ?? ""}
        itemType="shirt style / category"
        details={
          deleteTarget && (
            <div className="flex gap-4">
              <div className="relative w-20 h-20 bg-stone-100 flex-shrink-0 overflow-hidden rounded">
                {deleteTarget.image && (
                  <Image src={deleteTarget.image} alt={deleteTarget.name} fill className="object-cover" />
                )}
              </div>
              <div className="flex-1 space-y-1.5">
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Name</span>
                  <span className="text-stone-800 font-medium text-right">{deleteTarget.name}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-xs text-stone-400 uppercase tracking-widest">Order</span>
                  <span className="text-stone-700">{deleteTarget.display_order}</span>
                </div>
                {deleteTarget.description && (
                  <div className="flex justify-between gap-4">
                    <span className="text-xs text-stone-400 uppercase tracking-widest">Description</span>
                    <span className="text-stone-600 text-xs text-right max-w-[60%] line-clamp-2">{deleteTarget.description}</span>
                  </div>
                )}
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                  ⚠ Products with this style/category will need their category reassigned.
                </div>
              </div>
            </div>
          )
        }
      />
    </>
  );
}
