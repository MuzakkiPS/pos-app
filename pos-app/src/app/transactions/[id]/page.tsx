import { requireAdmin } from "@/src/lib/auth";
import AdminSidebar from "@/src/components/layout/TransactionSidebar";
import Link from "next/link";
import TransactionSidebar from "@/src/components/layout/TransactionSidebar";

type PageProps = {
  params: Promise<{ id: string }>;
};

const formatRupiah = (value: number | string | null | undefined) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value ?? 0));
};

const formatTanggal = (date: string) => {
  return new Date(date).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
};

export default async function TransactionDetailPage({ params }: PageProps) {
  const { supabase } = await requireAdmin();
  const { id } = await params;

  // 1. Ambil data transaksi
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return (
      <TransactionSidebar>
        <main className="min-h-screen bg-gray-100 p-6 md:p-8">
          <div className="mx-auto max-w-5xl rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-800">
              Transaksi Tidak Ditemukan
            </h1>

            <p className="mt-2 text-gray-500">
              Data transaksi tidak ditemukan atau sudah tidak tersedia.
            </p>

            <Link
              href="/transactions"
              className="mt-6 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-white transition hover:bg-blue-700"
            >
              ← Kembali ke Transaksi
            </Link>
          </div>
        </main>
      </TransactionSidebar>
    );
  }

  // 2. Ambil detail item transaksi
  const { data: orderItems, error: itemsError } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", order.id);

  // 3. Ambil nama kasir dari tabel users
  const { data: cashier } = await supabase
    .from("users")
    .select("username")
    .eq("id", order.user_id)
    .maybeSingle();

  // 4. Ambil nama produk dari tabel products
  const productIds = (orderItems ?? []).map((item) => item.product_id);

  let products: { id: number; name: string }[] = [];

  if (productIds.length > 0) {
    const { data: productData } = await supabase
      .from("products")
      .select("id, name")
      .in("id", productIds);

    products = productData ?? [];
  }

  // 5. Gabungkan order_items dengan nama produk
  const transactionDetails = (orderItems ?? []).map((item) => {
    const product = products.find((p) => p.id === item.product_id);

    return {
      ...item,
      productName: product?.name ?? "Produk tidak ditemukan",
    };
  });

  const totalProducts = transactionDetails.reduce(
    (sum, item) => sum + Number(item.quantity),
    0
  );

  const statusStyle: Record<string, string> = {
    completed: "bg-green-100 text-green-700",
    pending: "bg-yellow-100 text-yellow-700",
    cancelled: "bg-red-100 text-red-700",
  };

  const statusLabel: Record<string, string> = {
    completed: "Selesai",
    pending: "Pending",
    cancelled: "Dibatalkan",
  };

  return (
    <AdminSidebar>
      <main className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 md:text-3xl">
                Detail Transaksi
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Informasi lengkap transaksi dan produk yang dibeli.
              </p>
            </div>

            <Link
              href="/transactions"
              className="inline-flex w-fit items-center rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              ← Kembali ke Transaksi
            </Link>
          </div>

          {/* Transaction summary */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Transaction ID */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">ID Transaksi</p>
              <h2 className="mt-2 break-all text-lg font-bold text-gray-800">
                #{order.id}
              </h2>
            </div>

            {/* Status */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Status Transaksi</p>
              <div className="mt-3">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                    statusStyle[order.status] ??
                    "bg-gray-100 text-gray-600"
                  }`}
                >
                  {statusLabel[order.status] ?? order.status}
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">Tanggal Transaksi</p>
              <h2 className="mt-2 text-base font-semibold text-gray-800">
                {formatTanggal(order.created_at)}
              </h2>
            </div>
          </div>

          {/* Transaction information */}
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-lg font-bold text-gray-800">
              Informasi Transaksi
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <p className="text-sm text-gray-500">Nama Kasir</p>
                <p className="mt-1 font-semibold text-gray-800">
                  {cashier?.username ?? "Kasir tidak diketahui"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Jumlah Produk</p>
                <p className="mt-1 font-semibold text-gray-800">
                  {totalProducts} item
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">ID Pengguna</p>
                <p className="mt-1 break-all text-sm text-gray-700">
                  {order.user_id}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">ID Order</p>
                <p className="mt-1 font-semibold text-gray-800">
                  #{order.id}
                </p>
              </div>
            </div>
          </div>

          {/* Product details */}
          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-gray-100 p-6">
              <h2 className="text-lg font-bold text-gray-800">
                Daftar Produk
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Produk yang tercatat pada transaksi ini.
              </p>
            </div>

            {itemsError ? (
              <div className="p-6 text-sm text-red-600">
                Gagal mengambil detail produk transaksi.
              </div>
            ) : transactionDetails.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                Tidak ada produk pada transaksi ini.
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-sm text-gray-500">
                      <tr>
                        <th className="px-6 py-4 font-medium">No.</th>
                        <th className="px-6 py-4 font-medium">Nama Produk</th>
                        <th className="px-6 py-4 font-medium">Harga</th>
                        <th className="px-6 py-4 font-medium">Jumlah</th>
                        <th className="px-6 py-4 font-medium">Subtotal</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {transactionDetails.map((item, index) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-500">
                            {index + 1}
                          </td>

                          <td className="px-6 py-4 font-medium text-gray-800">
                            {item.productName}
                          </td>

                          <td className="px-6 py-4 text-gray-600">
                            {formatRupiah(item.price)}
                          </td>

                          <td className="px-6 py-4 text-gray-600">
                            {item.quantity}
                          </td>

                          <td className="px-6 py-4 font-semibold text-gray-800">
                            {formatRupiah(item.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile product list */}
                <div className="space-y-3 p-4 md:hidden">
                  {transactionDetails.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs text-gray-400">
                            Produk {index + 1}
                          </p>
                          <h3 className="mt-1 font-semibold text-gray-800">
                            {item.productName}
                          </h3>
                        </div>

                        <p className="font-semibold text-gray-800">
                          {formatRupiah(item.subtotal)}
                        </p>
                      </div>

                      <div className="mt-3 flex justify-between text-sm text-gray-500">
                        <span>{formatRupiah(item.price)} / item</span>
                        <span>Jumlah: {item.quantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Payment summary */}
          <div className="flex justify-end">
            <div className="w-full rounded-2xl bg-white p-6 shadow-sm sm:max-w-md">
              <h2 className="mb-5 text-lg font-bold text-gray-800">
                Ringkasan Pembayaran
              </h2>

              <div className="space-y-3">
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Total Belanja</span>
                  <span className="font-medium text-gray-800">
                    {formatRupiah(order.total)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Uang Diterima</span>
                  <span className="font-medium text-gray-800">
                    {formatRupiah(order.cash_received)}
                  </span>
                </div>

                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-gray-500">Kembalian</span>
                  <span className="font-medium text-gray-800">
                    {formatRupiah(order.change_amount)}
                  </span>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-gray-800">
                      Total Pembayaran
                    </span>

                    <span className="text-xl font-bold text-blue-600">
                      {formatRupiah(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom back button */}
          <div className="pb-4">
            <Link
              href="/transactions"
              className="inline-flex items-center rounded-xl bg-gray-800 px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-700"
            >
              ← Kembali ke Daftar Transaksi
            </Link>
          </div>
        </div>
      </main>
    </AdminSidebar>
  );
}