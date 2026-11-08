
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

type Category = {
  id: number;
  name: string;
  created_at: string;
};

type Props = {
  categories: Category[];
};

export default function CategoryManager({ categories }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const categoryName = name.trim();

    if (!categoryName) {
      setErrorMessage("Nama kategori wajib diisi.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      if (editingId !== null) {
        const { error } = await supabase
          .from("categories")
          .update({ name: categoryName })
          .eq("id", editingId);

        if (error) throw error;

        setSuccessMessage("Kategori berhasil diperbarui.");
      } else {
        const { error } = await supabase
          .from("categories")
          .insert({ name: categoryName });

        if (error) throw error;

        setSuccessMessage("Kategori berhasil ditambahkan.");
      }

      setName("");
      setEditingId(null);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan.";

      if (message.toLowerCase().includes("duplicate")) {
        setErrorMessage("Nama kategori tersebut sudah digunakan.");
      } else {
        setErrorMessage(`Gagal menyimpan kategori: ${message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleEdit(category: Category) {
    setEditingId(category.id);
    setName(category.name);
    setErrorMessage("");
    setSuccessMessage("");
  }

  function handleCancelEdit() {
    setEditingId(null);
    setName("");
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleDelete(category: Category) {
    const confirmed = window.confirm(
      `Yakin ingin menghapus kategori "${category.name}"?`
    );

    if (!confirmed) return;

    setDeletingId(category.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", category.id);

      if (error) throw error;

      setSuccessMessage("Kategori berhasil dihapus.");

      if (editingId === category.id) {
        setEditingId(null);
        setName("");
      }

      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan.";

      if (
        message.toLowerCase().includes("foreign key") ||
        message.toLowerCase().includes("violates")
      ) {
        setErrorMessage(
          "Kategori tidak dapat dihapus karena masih digunakan oleh produk."
        );
      } else {
        setErrorMessage(`Gagal menghapus kategori: ${message}`);
      }
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(280px,0.8fr)_1.2fr]">
      <section className="h-fit rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">
          {editingId !== null ? "Edit Kategori" : "Tambah Kategori"}
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          {editingId !== null
            ? "Ubah nama kategori yang dipilih."
            : "Masukkan nama kategori menu baru."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="categoryName"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Nama Kategori
            </label>

            <input
              id="categoryName"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Contoh: Makanan"
              maxLength={100}
              required
              disabled={loading}
              className="w-full rounde  d-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 text-black"
            />
          </div>

          {errorMessage && (
            <p
              role="alert"
              className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p
              role="status"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              {successMessage}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Menyimpan..."
                : editingId !== null
                  ? "Simpan Perubahan"
                  : "Tambah Kategori"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={handleCancelEdit}
                disabled={loading}
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-800">
            Daftar Kategori
          </h2>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-600">
            {categories.length} kategori
          </span>
        </div>

        {categories.length === 0 ? (
          <div className="mt-6 rounded-lg border border-dashed border-slate-300 p-8 text-center">
            <p className="font-medium text-slate-700">
              Belum ada kategori.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Tambahkan kategori pertama menggunakan formulir di sebelah kiri.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-4 py-3">Nama Kategori</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-4 py-4 font-medium text-slate-800">
                      {category.name}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(category)}
                          disabled={loading || deletingId !== null}
                          className="rounded-md bg-amber-100 px-3 py-2 font-medium text-amber-800 hover:bg-amber-200 disabled:opacity-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(category)}
                          disabled={loading || deletingId !== null}
                          className="rounded-md bg-red-100 px-3 py-2 font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
                        >
                          {deletingId === category.id
                            ? "Menghapus..."
                            : "Hapus"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
