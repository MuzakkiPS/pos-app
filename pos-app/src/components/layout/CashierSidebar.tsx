
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

type CashierSidebarProps = {
  children: React.ReactNode;
};

const menuItems = [
  {
    name: "Transaksi Baru",
    href: "/pos",
    icon: "🛒",
  },
  {
    name: "Riwayat Transaksi",
    href: "/transactions",
    icon: "📋",
  },
];

export default function CashierSidebar({
  children,
}: CashierSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const supabase = createClient();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
    console.error("Gagal logout:", error.message);
    setIsLoggingOut(false);
    return;
    }

    router.replace("/login");
    router.refresh();
  };

  const isActive = (href: string) => {
    if (href === "/pos") {
      return pathname === "/pos";
    }

    if (href === "/transactions") {
      return (
        pathname === "/transactions" ||
        pathname.startsWith("/transactions/")
      );
    }

    return pathname === href;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col bg-slate-900 text-white">
      {/* Logo / Header */}
      <div className="border-b border-slate-700 px-6 py-5">
        <h1 className="text-xl font-bold tracking-wide">
          POS System
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Cashier Panel
        </p>
      </div>

      {/* Profile */}
      <div className="border-b border-slate-700 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold">
            K
          </div>

          <div>
            <p className="text-sm font-semibold">Kasir</p>
            <p className="text-xs text-slate-400">
              Cashier Account
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <nav className="flex-1 space-y-2 px-3 py-5">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          Menu Utama
        </p>

        {menuItems.map((item) => {
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-700 p-4">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>🚪</span>
          <span>
            {isLoggingOut ? "Sedang keluar..." : "Logout"}
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 md:block">
        {sidebarContent}
      </aside>

      {/* Mobile Header */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 md:hidden">
        <div>
          <h1 className="font-bold text-gray-800">POS System</h1>
          <p className="text-xs text-gray-500">Cashier Panel</p>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Sidebar */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <aside className="fixed inset-y-0 left-0 z-50 w-64 md:hidden">
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="min-h-screen md:ml-64">
        {children}
      </div>
    </div>
  );
}
