
import { requireAdmin } from "@/src/lib/auth";
import ReportGenerator from "@/src/components/reports/ReportGenerator";
import AdminSidebar from "@/src/components/layout/TransactionSidebar";
import TransactionSidebar from "@/src/components/layout/TransactionSidebar";

function getJakartaDate() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export default async function ReportsPage() {
  const { profile } = await requireAdmin();

  const today = getJakartaDate();
  const firstDay = `${today.slice(0, 7)}-01`;

  return (
    <TransactionSidebar>
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6">
          <p className="text-sm text-slate-500">
            POS App / Laporan
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Laporan Penjualan
          </h1>

          <p className="mt-2 text-slate-600">
            Selamat datang, {profile.username}. Kelola laporan
            penjualan berdasarkan periode tanggal.
          </p>
        </div>

        <ReportGenerator
          initialStartDate={firstDay}
          initialEndDate={today}
        />
      </div>
    </main>
    </TransactionSidebar>
  );
}
