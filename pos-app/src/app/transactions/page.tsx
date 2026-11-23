
import Link from "next/link";
import { requireUser } from "@/src/lib/auth";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import CashierSidebar from "@/src/components/layout/TransactionSidebar";
import TransactionSidebar from "@/src/components/layout/TransactionSidebar";

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function TransactionsPage() {
  const { supabase, profile } = await requireUser();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      "id, user_id, total, cash_received, change_amount, status, created_at"
    )
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 md:p-8">
        <div className="mx-auto max-w-6xl rounded-xl bg-white p-6">
          <h1 className="text-2xl font-bold">Riwayat Transaksi</h1>
          <p className="mt-4 text-red-600">
            Gagal mengambil transaksi: {error.message}
          </p>
        </div>
      </main>
    );
  }

  const userIds = [...new Set((orders ?? []).map((order) => order.user_id))];

  let users: { id: string; username: string }[] = [];

  if (userIds.length > 0) {
    const { data, error: usersError } = await supabase
      .from("users")
      .select("id, username")
      .in("id", userIds);

    if (usersError) {
      return (
        <main className="min-h-screen bg-slate-100 p-6">
          <p className="text-red-600">
            Gagal mengambil informasi kasir: {usersError.message}
          </p>
        </main>
      );
    }

    users = data ?? [];
  }

  const cashierMap = new Map(
    users.map((user) => [user.id, user.username])
  );

  const totalSales = (orders ?? [])
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <TransactionSidebar>
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6">
          <Link
            href={profile.role === "admin" ? "/dashboard" : "/pos"}
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Kembali
          </Link>

          <p className="mt-5 text-sm text-slate-500">
            POS App / Transaksi
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Riwayat Transaksi
          </h1>

          <p className="mt-2 text-slate-600">
            {profile.role === "admin"
              ? "Menampilkan seluruh transaksi dari semua kasir."
              : "Menampilkan riwayat transaksi yang kamu lakukan."}
          </p>
        </div>

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Jumlah Transaksi</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              {(orders ?? []).length}
            </p>
          </div>

          <div className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Penjualan Selesai</p>
            <p className="mt-2 text-2xl font-bold text-green-700">
              {formatRupiah(totalSales)}
            </p>
          </div>
        </div>

        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-800">
              Daftar Transaksi
            </h2>
          </div>

          {!orders || orders.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-slate-700">
                Belum ada transaksi.
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Transaksi yang berhasil dilakukan akan muncul di sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-5 py-4">No. Transaksi</th>
                    <th className="px-5 py-4">Tanggal</th>
                    <th className="px-5 py-4">Kasir</th>
                    <th className="px-5 py-4">Total</th>
                    <th className="px-5 py-4">Status</th>
                    {profile.role === "admin" && (
                    <th className="px-5 py-4 text-center">Detail</th>
                    )}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        #{order.id}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                        {formatDate(order.created_at)}
                      </td>

                      <td className="px-5 py-4 text-slate-700">
                        {cashierMap.get(order.user_id) ?? "Tidak diketahui"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                        {formatRupiah(Number(order.total))}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={
                            order.status === "completed"
                              ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                              : order.status === "cancelled"
                                ? "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                                : "rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                          }
                        >
                          {order.status === "completed"
                            ? "Selesai"
                            : order.status === "cancelled"
                              ? "Dibatalkan"
                              : "Menunggu"}
                        </span>
                      </td>

                    {profile.role === "admin" && (
                      <td className="px-5 py-4 text-center">
                        <Link
                          href={`/transactions/${order.id}`}
                          className="inline-block rounded-lg bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700"
                        >
                          Lihat
                        </Link>
                      </td>
                    )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
 </TransactionSidebar>
  );
}
