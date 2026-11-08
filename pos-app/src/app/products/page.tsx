
import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth";
import DeleteProductButton from "@/src/components/products/DeleteProductButton";


export default async function ProductsPage() {
  const { supabase } = await requireAdmin();

  const { data: products, error } = await supabase
    .from("products")
    .select(`
      id,
      name,
      photo,
      price,
      is_available,
      categories (
        name
      )
    `)
    .order("id", { ascending: false });

  if (error) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">
          Daftar Produk
        </h1>
        <p className="mt-4 text-red-600">
          Gagal mengambil data produk: {error.message}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm text-slate-500">
              POS App / Produk
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Daftar Produk
            </h1>

            <p className="mt-2 text-slate-600">
              Kelola menu makanan dan minuman.
            </p>
          </div>

          <Link
            href="/products/create"
            className="rounded-lg bg-slate-900 px-5 py-3 text-center font-semibold text-white hover:bg-slate-700"
          >
            + Tambah Produk
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="mt-8 rounded-xl bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800">
              Belum ada produk
            </h2>

            <p className="mt-2 text-slate-500">
              Tambahkan produk pertama untuk mulai membangun katalog menu.
            </p>

            <Link
              href="/products/create"
              className="mt-5 inline-block rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              Tambah Produk Pertama
            </Link>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-xl bg-white shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-5 py-4">Produk</th>
                  <th className="px-5 py-4">Kategori</th>
                  <th className="px-5 py-4">Harga</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {products.map((product) => {
                  const category = Array.isArray(product.categories)
                    ? product.categories[0]
                    : product.categories;

                  const photoUrl = product.photo
                    ? supabase.storage
                        .from("product-images")
                        .getPublicUrl(product.photo).data.publicUrl
                    : null;

                  return (
                    <tr key={product.id}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt={product.name}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                              No foto
                            </div>
                          )}

                          <span className="font-medium text-slate-800">
                            {product.name}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-slate-600">
                        {category?.name ?? "-"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-700">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          maximumFractionDigits: 0,
                        }).format(Number(product.price))}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            product.is_available
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                              : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                          }
                        >
                          {product.is_available
                            ? "Tersedia"
                            : "Tidak tersedia"}
                        </span>
                      </td>
                   <td className="px-5 py-4">
  <div className="flex justify-end gap-2">
    <Link
      href={`/products/${product.id}/edit`}
      className="rounded-md bg-amber-100 px-3 py-2 font-medium text-amber-800 hover:bg-amber-200"
    >
      Edit
    </Link>

    <DeleteProductButton
      id={product.id}
      name={product.name}
      photo={product.photo}
    />
  </div>
</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
