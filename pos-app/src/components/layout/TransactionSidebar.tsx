
import { requireUser } from "@/src/lib/auth";
import AdminSidebar from "@/src/components/layout/AdminSidebar";
import CashierSidebar from "@/src/components/layout/CashierSidebar";

type Props = {
  children: React.ReactNode;
};

export default async function TransactionSidebar({ children }: Props) {
  const { profile } = await requireUser();

  if (profile.role === "admin") {
    return <AdminSidebar>{children}</AdminSidebar>;
  }

  if (profile.role === "cashier") {
    return <CashierSidebar>{children}</CashierSidebar>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="rounded-xl bg-white p-8 text-center shadow">
        <h1 className="text-xl font-bold text-gray-800">
          Akses Ditolak
        </h1>
        <p className="mt-2 text-gray-500">
          Role pengguna tidak memiliki akses ke halaman ini.
        </p>
      </div>
    </div>
  );
}
