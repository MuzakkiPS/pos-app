
import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth";
import ProductForm from "@/src/components/products/ProductForm";

export default async function CreateProductPage() {
  const { supabase } = await requireAdmin();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name");

  if (error) {
    return (
      <main className="p-8">
        <p className="text-red-600">
          Gagal mengambil kategori: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/products"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          ← Kembali ke Produk
        </Link>

        <div className="mt-5">
          <p className="text-sm text-slate-500">POS App / Produk / Tambah</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Tambah Produk
          </h1>
          <p className="mt-2 text-slate-600">
            Masukkan informasi menu dan foto produk.
          </p>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          {categories && categories.length > 0 ? (
            <ProductForm categories={categories} />
          ) : (
            <div className="rounded-lg bg-amber-50 p-4 text-amber-800">
              Belum ada kategori. Tambahkan kategori terlebih dahulu di halaman
              <Link href="/categories" className="ml-1 font-semibold underline">
                Kelola Kategori
              </Link>.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
