
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

const menuItems = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: "▦",
  },
  {
    name: "Kategori",
    href: "/categories",
    icon: "▤",
  },
  {
    name: "Produk",
    href: "/products",
    icon: "□",
  },
  {
    name: "Transaksi",
    href: "/transactions",
    icon: "▣",
  },
  {
    name: "Laporan",
    href: "/reports",
    icon: "▥",
  },
];

export default function AdminSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      alert("Gagal logout: " + error.message);
      setLoggingOut(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const sidebarContent = (
    <>
      <div className="flex h-20 items-center gap-3 border-b border-slate-700 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-xl font-bold text-white">
          P
        </div>

        <div>
          <h1 className="text-xl font-bold text-white">POS App</h1>
          <p className="text-xs text-slate-400">Admin Panel</p>
        </div>
      </div>

      <div className="px-4 py-6">
        <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
          Menu Utama
        </p>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <span className="w-5 text-center text-lg">
                  {item.icon}
                </span>

                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="mt-auto border-t border-slate-700 p-4">
        <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-800 p-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
            A
          </div>

          <div>
            <p className="text-sm font-semibold text-white">
              Administrator
            </p>
            <p className="text-xs text-slate-400">Admin</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
        >
          <span className="text-lg">↪</span>
          {loggingOut ? "Sedang logout..." : "Logout"}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header mobile */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between bg-slate-900 px-4 text-white lg:hidden">
        <div className="flex items-center gap-2">
          <span className="font-bold">POS App</span>
          <span className="text-xs text-slate-400">Admin</span>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-slate-800"
          aria-label="Buka menu navigasi"
        >
          {mobileOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-slate-900 lg:flex">
        {sidebarContent}
      </aside>

      {/* Sidebar mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-black/50"
          />

          <aside className="relative flex h-full w-72 flex-col bg-slate-900 shadow-xl">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Konten halaman */}
      <div className="lg:pl-64">
        {children}
      </div>
    </div>
  );
}
