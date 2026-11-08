
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/src/lib/auth";
import ProductForm from "@/src/components/products/ProductForm";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;

  if (!/^\d+$/.test(id)) {
    notFound();
  }

  const { supabase } = await requireAdmin();

  const [productResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, category_id, photo, price, is_available")
      .eq("id", Number(id))
      .maybeSingle(),

    supabase
      .from("categories")
      .select("id, name")
      .order("name"),
  ]);

  if (productResult.error || categoriesResult.error) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">
            Gagal Memuat Produk
          </h1>
          <p className="mt-3 text-red-600">
            {productResult.error?.message ??
              categoriesResult.error?.message}
          </p>
          <Link
            href="/products"
            className="mt-5 inline-block text-blue-600 hover:underline"
          >
            Kembali ke daftar produk
          </Link>
        </div>
      </main>
    );
  }

  if (!productResult.data) {
    notFound();
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
          <p className="text-sm text-slate-500">
            POS App / Produk / Edit
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Edit Produk
          </h1>
          <p className="mt-2 text-slate-600">
            Ubah informasi produk yang dipilih.
          </p>
        </div>

        <div className="mt-8 rounded-xl bg-white p-6 shadow-sm">
          {categoriesResult.data &&
          categoriesResult.data.length > 0 ? (
            <ProductForm
              categories={categoriesResult.data}
              product={productResult.data}
            />
          ) : (
            <p className="rounded-lg bg-amber-50 p-4 text-amber-800">
              Belum ada kategori. Buat kategori terlebih dahulu.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
