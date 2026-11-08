
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

type Props = {
  id: number;
  name: string;
  photo: string | null;
};

export default function DeleteProductButton({
  id,
  name,
  photo,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(
      `Yakin ingin menghapus produk "${name}"? Tindakan ini tidak dapat dibatalkan.`
    );

    if (!confirmed) return;

    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) {
        const message = error.message.toLowerCase();

        if (
          message.includes("foreign key") ||
          message.includes("violates")
        ) {
          throw new Error(
            "Produk tidak dapat dihapus karena sudah digunakan dalam transaksi."
          );
        }

        throw error;
      }

      // Hapus foto hanya setelah data produk berhasil dihapus.
      if (photo) {
        const { error: photoError } = await supabase.storage
          .from("product-images")
          .remove([photo]);

        if (photoError) {
          console.error(
            "Produk terhapus, tetapi foto gagal dihapus:",
            photoError.message
          );
        }
      }

      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal menghapus produk."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-md bg-red-100 px-3 py-2 font-medium text-red-700 hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Menghapus..." : "Hapus"}
      </button>

      {errorMessage && (
        <p role="alert" className="max-w-56 text-right text-xs text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
