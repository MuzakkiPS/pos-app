
"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/src/lib/supabase/client";

type Product = {
  id: number;
  name: string;
  price: number;
  category: string;
  photo: string | null;
};

type CartItem = {
  product: Product;
  quantity: number;
};

type Props = {
  products: Product[];
};

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

export default function POSInterface({ products }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cash, setCash] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [receipt, setReceipt] = useState<{
    id: number;
    total: number;
    cash: number;
    change: number;
  } | null>(null);

  const total = useMemo(
    () =>
      cart.reduce(
        (sum, item) => sum + item.product.price * item.quantity,
        0
      ),
    [cart]
  );

  const cashAmount = Number(cash);
  const change = cashAmount - total;

  function addProduct(product: Product) {
    setReceipt(null);
    setMessage("");
    setErrorMessage("");

    setCart((current) => {
      const existing = current.find(
        (item) => item.product.id === product.id
      );

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: number, amount: number) {
    setReceipt(null);

    setCart((current) =>
      current
        .map((item) =>
          item.product.id === productId
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(productId: number) {
    setReceipt(null);
    setCart((current) =>
      current.filter((item) => item.product.id !== productId)
    );
  }

  async function handleCheckout() {
    setErrorMessage("");
    setMessage("");
    setReceipt(null);

    if (cart.length === 0) {
      setErrorMessage("Keranjang masih kosong.");
      return;
    }

    if (
      cash.trim() === "" ||
      !Number.isSafeInteger(cashAmount) ||
      cashAmount < total
    ) {
      setErrorMessage("Uang pembayaran tidak mencukupi.");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } = await supabase.rpc("create_pos_order", {
        p_items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
        })),
        p_cash_received: cashAmount,
      });

      if (error) throw error;

      const result = data as {
        order_id: number;
        total: number;
        cash_received: number;
        change_amount: number;
      };

      setReceipt({
        id: result.order_id,
        total: Number(result.total),
        cash: Number(result.cash_received),
        change: Number(result.change_amount),
      });

      setCart([]);
      setCash("");
      setMessage("Transaksi berhasil disimpan.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Transaksi gagal diproses."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
      {/* Daftar Menu */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">
          Daftar Menu
        </h2>

        {products.length === 0 ? (
          <p className="mt-6 rounded-lg bg-slate-50 p-6 text-center text-slate-500">
            Belum ada produk yang tersedia untuk dijual.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {products.map((product) => (
              <button
                key={product.id}
                type="button"
                onClick={() => addProduct(product)}
                disabled={loading}
                className="overflow-hidden rounded-xl border border-slate-200 text-left transition hover:border-blue-400 hover:shadow-md disabled:opacity-50"
              >
                {product.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.photo}
                    alt={product.name}
                    className="h-32 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-32 items-center justify-center bg-slate-100 text-sm text-slate-400">
                    Tidak ada foto
                  </div>
                )}

                <div className="p-3">
                  <p className="font-semibold text-slate-800">
                    {product.name}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {product.category}
                  </p>
                  <p className="mt-2 font-bold text-blue-600">
                    {formatRupiah(product.price)}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Keranjang */}
      <section className="h-fit rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800">
          Keranjang Belanja
        </h2>

        {cart.length === 0 ? (
          <p className="mt-5 rounded-lg bg-slate-50 p-6 text-center text-slate-500">
            Belum ada produk dipilih.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="border-b border-slate-100 pb-4"
              >
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.product.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {formatRupiah(item.product.price)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(item.product.id)}
                    disabled={loading}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Hapus
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.product.id, -1)
                      }
                      disabled={loading}
                      className="h-8 w-8 rounded-md bg-slate-100 font-bold"
                    >
                      -
                    </button>

                    <span className="font-semibold">
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(item.product.id, 1)
                      }
                      disabled={loading}
                      className="h-8 w-8 rounded-md bg-slate-100 font-bold"
                    >
                      +
                    </button>
                  </div>

                  <p className="font-semibold text-slate-800">
                    {formatRupiah(
                      item.product.price * item.quantity
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-5 space-y-3 border-t border-slate-200 pt-5">
          <div className="flex justify-between">
            <span className="text-slate-600">Total Belanja</span>
            <span className="text-xl font-bold text-slate-900">
              {formatRupiah(total)}
            </span>
          </div>

          <div>
            <label
              htmlFor="cash"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Uang Diterima (Rp)
            </label>

            <input
              id="cash"
              type="number"
              min="0"
              step="1"
              value={cash}
              onChange={(e) => setCash(e.target.value)}
              disabled={loading || cart.length === 0}
              placeholder="Masukkan uang pelanggan"
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 disabled:bg-slate-100"
            />
          </div>

          <div className="flex justify-between">
            <span className="text-slate-600">Kembalian</span>
            <span className="font-bold text-green-700">
              {formatRupiah(
                cart.length > 0 && change >= 0 ? change : 0
              )}
            </span>
          </div>

          {errorMessage && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </p>
          )}

          {message && (
            <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
              {message}
            </p>
          )}

          <button
            type="button"
            onClick={handleCheckout}
            disabled={
              loading ||
              cart.length === 0 ||
              !Number.isSafeInteger(cashAmount) ||
              cashAmount < total
            }
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Memproses..." : "Bayar Sekarang"}
          </button>
        </div>

        {receipt && (
          <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">
            <h3 className="font-bold text-green-800">
              Transaksi Berhasil!
            </h3>
            <p className="mt-2 text-sm text-green-700">
              Nomor transaksi: #{receipt.id}
            </p>
            <p className="mt-1 text-sm text-green-700">
              Total: {formatRupiah(receipt.total)}
            </p>
            <p className="mt-1 text-sm text-green-700">
              Uang diterima: {formatRupiah(receipt.cash)}
            </p>
            <p className="mt-1 font-bold text-green-800">
              Kembalian: {formatRupiah(receipt.change)}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
