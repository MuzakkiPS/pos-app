
import { requireUser } from "@/src/lib/auth";
import POSInterface from "@/src/components/pos/POSInterface";

export default async function POSPage() {
  const { supabase, profile } = await requireUser();

  // Mengambil produk yang tersedia.
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, photo, price, category_id")
    .eq("is_available", true)
    .order("name");

  if (productError) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <h1 className="text-2xl font-bold">Halaman Kasir</h1>
        <p className="mt-4 text-red-600">
          Gagal mengambil produk: {productError.message}
        </p>
      </main>
    );
  }

  // Mengambil kategori.
  const { data: categories, error: categoryError } = await supabase
    .from("categories")
    .select("id, name");

  if (categoryError) {
    return (
      <main className="min-h-screen bg-slate-100 p-8">
        <h1 className="text-2xl font-bold">Halaman Kasir</h1>
        <p className="mt-4 text-red-600">
          Gagal mengambil kategori: {categoryError.message}
        </p>
      </main>
    );
  }

  // Menghubungkan produk dengan kategori berdasarkan ID.
  const menu = (products ?? []).map((product) => {
    const category = (categories ?? []).find(
      (item) => item.id === product.category_id
    );

    return {
      id: Number(product.id),
      name: product.name,
      price: Number(product.price),
      category: category?.name ?? "-",
      photo: product.photo
        ? supabase.storage
            .from("product-images")
            .getPublicUrl(product.photo).data.publicUrl
        : null,
    };
  });

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-slate-500">
            POS App / Kasir
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Halaman Kasir
          </h1>

          <p className="mt-2 text-slate-600">
            Halo, {profile.username}. Silakan mulai transaksi.
          </p>
        </div>

        <POSInterface products={menu} />
      </div>
    </main>
  );
}
