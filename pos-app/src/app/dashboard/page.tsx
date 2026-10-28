
import { requireAdmin } from "@/src/lib/auth";

export default async function DashboardPage() {
  const { profile } = await requireAdmin();

  return (
    <main className="min-h-screen bg-slate-100 p-8">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm text-slate-500">
          POS App / Dashboard
        </p>

        <h1 className="mt-2 text-3xl font-bold text-slate-800">
          Dashboard Admin
        </h1>

        <p className="mt-3 text-slate-600">
          Selamat datang, {profile.username}!
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Produk
            </p>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Total Kategori
            </p>
            <p className="mt-2 text-2xl font-bold">-</p>
          </div>

          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Status Akun
            </p>
            <p className="mt-2 text-lg font-semibold text-green-700">
              Admin
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
