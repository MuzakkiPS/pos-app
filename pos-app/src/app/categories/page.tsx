
import Link from "next/link";
import { requireAdmin } from "@/src/lib/auth";
import CategoryManager from "./CategoryManager";

export default async function CategoriesPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, name, created_at")
    .order("id", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-slate-100 p-6 md:p-8">
        <div className="mx-auto max-w-5xl rounded-xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">
            Daftar Kategori
          </h1>
          <p className="mt-4 text-red-600">
            Gagal mengambil kategori: {error.message}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-6 md:p-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            ← Kembali ke Dashboard
          </Link>

          <p className="mt-5 text-sm text-slate-500">
            POS App / Kategori
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Kelola Kategori
          </h1>

          <p className="mt-2 text-slate-600">
            Selamat datang, {profile.username}. Kelola kategori menu
            makanan dan minuman di sini.
          </p>
        </div>

        <CategoryManager categories={categories ?? []} />
      </div>
    </main>
  );
}
