
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

type Category = {
  id: number;
  name: string;
};

type Product = {
  id: number;
  name: string;
  category_id: number;
  photo: string | null;
  price: number;
  is_available: boolean;
};

type Props = {
  categories: Category[];
  product?: Product;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export default function ProductForm({ categories, product }: Props) {
  const router = useRouter();
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [categoryId, setCategoryId] = useState(
    product ? String(product.category_id) : ""
  );
  const [price, setPrice] = useState(
    product ? String(product.price) : ""
  );
  const [isAvailable, setIsAvailable] = useState(
    product?.is_available ?? true
  );
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!photo) {
      setPreview(null);
      return;
    }

    const objectUrl = URL.createObjectURL(photo);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [photo]);

  const existingPhotoUrl = product?.photo
    ? createClient()
        .storage.from("product-images")
        .getPublicUrl(product.photo).data.publicUrl
    : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    const numericPrice = Number(price);
    const numericCategoryId = Number(categoryId);

    if (!trimmedName) {
      setErrorMessage("Nama produk wajib diisi.");
      return;
    }

    if (!categoryId || !categories.some((c) => c.id === numericCategoryId)) {
      setErrorMessage("Silakan pilih kategori yang valid.");
      return;
    }

    if (price.trim() === "" || !Number.isFinite(numericPrice) || numericPrice < 0) {
      setErrorMessage("Harga harus berupa angka nol atau lebih.");
      return;
    }

    if (photo && !ALLOWED_TYPES.includes(photo.type)) {
      setErrorMessage("Format foto harus JPG, PNG, atau WebP.");
      return;
    }

    if (photo && photo.size > MAX_FILE_SIZE) {
      setErrorMessage("Ukuran foto maksimal 5 MB.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    let uploadedPath: string | null = null;
    let oldPhotoPath: string | null = null;

    try {
      if (photo) {
        const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        const filePath = `${crypto.randomUUID()}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("product-images")
          .upload(filePath, photo, {
            cacheControl: "3600",
            contentType: photo.type,
            upsert: false,
          });

        if (uploadError) throw uploadError;

        uploadedPath = filePath;
      }

      const values = {
        name: trimmedName,
        category_id: numericCategoryId,
        price: numericPrice,
        is_available: isAvailable,
        ...(uploadedPath ? { photo: uploadedPath } : {}),
      };

      if (isEditing && product) {
        const { error: updateError } = await supabase
          .from("products")
          .update(values)
          .eq("id", product.id);

        if (updateError) throw updateError;

        if (uploadedPath && product.photo) {
          oldPhotoPath = product.photo;
        }
      } else {
        const { error: insertError } = await supabase
          .from("products")
          .insert(values);

        if (insertError) throw insertError;
      }

      if (oldPhotoPath) {
        const { error: removeOldError } = await supabase.storage
          .from("product-images")
          .remove([oldPhotoPath]);

        if (removeOldError) {
          console.error("Foto lama gagal dihapus:", removeOldError.message);
        }
      }

      router.push("/products");
      router.refresh();
    } catch (error) {
      if (uploadedPath) {
        await supabase.storage
          .from("product-images")
          .remove([uploadedPath]);
      }

      const message =
        error instanceof Error ? error.message : "Terjadi kesalahan.";

      setErrorMessage(`Gagal menyimpan produk: ${message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="productName" className="mb-2 block text-sm font-medium text-slate-700">
          Nama Produk
        </label>
        <input
          id="productName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Contoh: Nasi Goreng"
          maxLength={150}
          required
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="category" className="mb-2 block text-sm font-medium text-slate-700">
          Kategori
        </label>
        <select
          id="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
        >
          <option value="">Pilih kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="price" className="mb-2 block text-sm font-medium text-slate-700">
          Harga (Rp)
        </label>
        <input
          id="price"
          type="number"
          min="0"
          step="1"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Contoh: 15000"
          required
          disabled={loading}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label htmlFor="photo" className="mb-2 block text-sm font-medium text-slate-700">
          Foto Produk (opsional, maksimal 5 MB)
        </label>
        <input
          id="photo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={loading}
          onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
          className="w-full rounded-lg border border-slate-300 p-3 text-sm"
        />

        {(preview || existingPhotoUrl) && (
          <div className="mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview ?? existingPhotoUrl ?? ""}
              alt="Pratinjau foto produk"
              className="h-40 w-40 rounded-lg border border-slate-200 object-cover"
            />
            {photo && (
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="mt-2 block text-sm text-red-600 hover:underline"
              >
                Batalkan foto baru
              </button>
            )}
          </div>
        )}
      </div>

      <label className="flex items-center gap-3 rounded-lg bg-slate-50 p-4">
        <input
          type="checkbox"
          checked={isAvailable}
          onChange={(e) => setIsAvailable(e.target.checked)}
          disabled={loading}
          className="h-4 w-4"
        />
        <span className="text-sm font-medium text-slate-700">
          Produk tersedia untuk dijual
        </span>
      </label>

      {errorMessage && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading
            ? "Menyimpan..."
            : isEditing
              ? "Simpan Perubahan"
              : "Tambah Produk"}
        </button>

        <button
          type="button"
          onClick={() => router.push("/products")}
          disabled={loading}
          className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
