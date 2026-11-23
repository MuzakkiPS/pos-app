
"use client";

import { useState } from "react";
import { createClient } from "@/src/lib/supabase/client";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

type Props = {
  initialStartDate: string;
  initialEndDate: string;
};

type Order = {
  id: number;
  user_id: string;
  total: number;
  cash_received: number;
  change_amount: number;
  status: string;
  created_at: string;
};

type Cashier = {
  id: string;
  username: string;
};

type OrderItem = {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price: number;
  subtotal: number;
};

type Product = {
  id: number;
  name: string;
};

type ReportRow = Order & {
  cashier_name: string;
};

type ReportDetail = OrderItem & {
  product_name: string;
};

function formatRupiah(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

export default function ReportGenerator({
  initialStartDate,
  initialEndDate,
}: Props) {
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);

  const [orders, setOrders] = useState<ReportRow[]>([]);
  const [details, setDetails] = useState<ReportDetail[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const completedOrders = orders.filter(
    (order) => order.status === "completed"
  );

  const totalSales = completedOrders.reduce(
    (sum, order) => sum + Number(order.total),
    0
  );

  const totalProducts = details
    .filter((item) =>
      completedOrders.some((order) => order.id === item.order_id)
    )
    .reduce((sum, item) => sum + Number(item.quantity), 0);

  const averageSales =
    completedOrders.length > 0
      ? totalSales / completedOrders.length
      : 0;

  async function loadReport() {
    setErrorMessage("");
    setLoaded(false);

    if (!startDate || !endDate) {
      setErrorMessage("Silakan pilih tanggal awal dan akhir.");
      return;
    }

    if (startDate > endDate) {
      setErrorMessage(
        "Tanggal awal tidak boleh melebihi tanggal akhir."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // Batas waktu menggunakan zona waktu lokal browser.
      const start = new Date(`${startDate}T00:00:00`);
      const endExclusive = new Date(`${endDate}T00:00:00`);
      endExclusive.setDate(endExclusive.getDate() + 1);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, user_id, total, cash_received, change_amount, status, created_at"
        )
        .gte("created_at", start.toISOString())
        .lt("created_at", endExclusive.toISOString())
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      const rawOrders = (orderData ?? []) as Order[];

      const userIds = [
        ...new Set(rawOrders.map((order) => order.user_id)),
      ];

      const orderIds = rawOrders.map((order) => order.id);

      let cashiers: Cashier[] = [];
      let rawDetails: OrderItem[] = [];
      let products: Product[] = [];

      if (userIds.length > 0) {
        const { data, error } = await supabase
          .from("users")
          .select("id, username")
          .in("id", userIds);

        if (error) throw error;

        cashiers = (data ?? []) as Cashier[];
      }

      if (orderIds.length > 0) {
        const { data, error } = await supabase
          .from("order_items")
          .select("id, order_id, product_id, quantity, price, subtotal")
          .in("order_id", orderIds)
          .order("id");

        if (error) throw error;

        rawDetails = (data ?? []) as OrderItem[];

        const productIds = [
          ...new Set(rawDetails.map((item) => item.product_id)),
        ];

        if (productIds.length > 0) {
          const { data: productData, error: productError } =
            await supabase
              .from("products")
              .select("id, name")
              .in("id", productIds);

          if (productError) throw productError;

          products = (productData ?? []) as Product[];
        }
      }

      const cashierMap = new Map(
        cashiers.map((cashier) => [cashier.id, cashier.username])
      );

      const productMap = new Map(
        products.map((product) => [product.id, product.name])
      );

      const mappedOrders: ReportRow[] = rawOrders.map((order) => ({
        ...order,
        cashier_name:
          cashierMap.get(order.user_id) ?? "Tidak diketahui",
      }));

      const mappedDetails: ReportDetail[] = rawDetails.map((item) => ({
        ...item,
        product_name:
          productMap.get(item.product_id) ??
          `Produk #${item.product_id}`,
      }));

      setOrders(mappedOrders);
      setDetails(mappedDetails);
      setLoaded(true);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Gagal mengambil laporan."
      );
    } finally {
      setLoading(false);
    }
  }

  function downloadPDF() {
    if (!loaded) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("LAPORAN PENJUALAN", 14, 18);

    doc.setFontSize(10);
    doc.text(
      `Periode: ${formatDateOnly(startDate)} - ${formatDateOnly(endDate)}`,
      14,
      27
    );

    doc.text(
      `Dicetak: ${new Date().toLocaleString("id-ID")}`,
      14,
      33
    );

    autoTable(doc, {
      startY: 40,
      head: [["Ringkasan", "Nilai"]],
      body: [
        ["Total Omzet Selesai", formatRupiah(totalSales)],
        ["Jumlah Transaksi Selesai", String(completedOrders.length)],
        ["Total Produk Terjual", String(totalProducts)],
        ["Rata-rata Transaksi", formatRupiah(averageSales)],
      ],
      theme: "grid",
      headStyles: { fillColor: [30, 64, 175] },
    });

    const summaryEnd =
      (doc as jsPDF & { lastAutoTable?: { finalY: number } })
        .lastAutoTable?.finalY ?? 90;

    autoTable(doc, {
      startY: summaryEnd + 10,
      head: [[
        "No.",
        "Tanggal",
        "Kasir",
        "Total",
        "Uang Diterima",
        "Kembalian",
        "Status",
      ]],
      body: orders.map((order, index) => [
        String(index + 1),
        formatDate(order.created_at),
        order.cashier_name,
        formatRupiah(Number(order.total)),
        formatRupiah(Number(order.cash_received)),
        formatRupiah(Number(order.change_amount)),
        order.status === "completed"
          ? "Selesai"
          : order.status === "cancelled"
            ? "Dibatalkan"
            : "Menunggu",
      ]),
      theme: "striped",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    const safeStart = startDate.replaceAll("-", "");
    const safeEnd = endDate.replaceAll("-", "");

    doc.save(`Laporan-Penjualan-${safeStart}-${safeEnd}.pdf`);
  }

  function downloadExcel() {
    if (!loaded) return;

    const workbook = XLSX.utils.book_new();

    // Sheet ringkasan.
    const summaryData = [
      ["LAPORAN PENJUALAN"],
      ["Periode", `${startDate} sampai ${endDate}`],
      ["Dicetak", new Date().toLocaleString("id-ID")],
      [],
      ["Ringkasan", "Nilai"],
      ["Total Omzet Selesai", totalSales],
      ["Jumlah Transaksi Selesai", completedOrders.length],
      ["Total Produk Terjual", totalProducts],
      ["Rata-rata Transaksi", averageSales],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet["!cols"] = [{ wch: 30 }, { wch: 25 }];

    XLSX.utils.book_append_sheet(
      workbook,
      summarySheet,
      "Ringkasan"
    );

    // Sheet daftar transaksi.
    const transactionData = orders.map((order, index) => ({
      No: index + 1,
      "ID Transaksi": order.id,
      Tanggal: formatDate(order.created_at),
      Kasir: order.cashier_name,
      Total: Number(order.total),
      "Uang Diterima": Number(order.cash_received),
      Kembalian: Number(order.change_amount),
      Status: order.status,
    }));

    const transactionSheet = XLSX.utils.json_to_sheet(transactionData);
    transactionSheet["!cols"] = [
      { wch: 8 },
      { wch: 15 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      transactionSheet,
      "Transaksi"
    );

    // Sheet detail produk.
    const detailData = details.map((item) => {
      const order = orders.find(
        (transaction) => transaction.id === item.order_id
      );

      return {
        "ID Transaksi": item.order_id,
        Tanggal: order ? formatDate(order.created_at) : "-",
        Produk: item.product_name,
        Jumlah: Number(item.quantity),
        "Harga Satuan": Number(item.price),
        Subtotal: Number(item.subtotal),
      };
    });

    const detailSheet = XLSX.utils.json_to_sheet(detailData);
    detailSheet["!cols"] = [
      { wch: 15 },
      { wch: 24 },
      { wch: 25 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(
      workbook,
      detailSheet,
      "Detail Produk"
    );

    const safeStart = startDate.replaceAll("-", "");
    const safeEnd = endDate.replaceAll("-", "");

    XLSX.writeFile(
      workbook,
      `Laporan-Penjualan-${safeStart}-${safeEnd}.xlsx`
    );
  }

  return (
    <div>
      {/* Filter tanggal */}
      <section className="rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800">
          Filter Periode Laporan
        </h2>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="startDate"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tanggal Awal
            </label>

            <input
              id="startDate"
              type="date"
              value={startDate}
              max={endDate}
              onChange={(event) => setStartDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
          </div>

          <div>
            <label
              htmlFor="endDate"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Tanggal Akhir
            </label>

            <input
              id="endDate"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={loadReport}
          disabled={loading}
          className="mt-5 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Mengambil Data..." : "Tampilkan Laporan"}
        </button>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {errorMessage}
          </p>
        )}
      </section>

      {/* Hasil laporan */}
      {loaded && (
        <>
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Hasil Laporan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {formatDateOnly(startDate)} - {formatDateOnly(endDate)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={downloadPDF}
                className="rounded-lg bg-red-600 px-4 py-3 font-semibold text-white hover:bg-red-700"
              >
                Unduh PDF
              </button>

              <button
                type="button"
                onClick={downloadExcel}
                className="rounded-lg bg-green-700 px-4 py-3 font-semibold text-white hover:bg-green-800"
              >
                Unduh Excel
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Total Omzet"
              value={formatRupiah(totalSales)}
            />
            <SummaryCard
              label="Transaksi Selesai"
              value={String(completedOrders.length)}
            />
            <SummaryCard
              label="Produk Terjual"
              value={String(totalProducts)}
            />
            <SummaryCard
              label="Rata-rata Transaksi"
              value={formatRupiah(averageSales)}
            />
          </div>

          <section className="mt-6 overflow-hidden rounded-xl bg-white shadow-sm">
            <div className="border-b border-slate-100 p-5">
              <h2 className="font-bold text-slate-800">
                Rincian Transaksi
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {orders.length} transaksi ditemukan dalam periode ini.
              </p>
            </div>

            {orders.length === 0 ? (
              <p className="p-8 text-center text-slate-500">
                Tidak ada transaksi pada periode yang dipilih.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-5 py-4">No. Transaksi</th>
                      <th className="px-5 py-4">Tanggal</th>
                      <th className="px-5 py-4">Kasir</th>
                      <th className="px-5 py-4">Total</th>
                      <th className="px-5 py-4">Status</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="px-5 py-4 font-semibold">
                          #{order.id}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-5 py-4">
                          {order.cashier_name}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold">
                          {formatRupiah(Number(order.total))}
                        </td>
                        <td className="px-5 py-4">
                          {order.status === "completed"
                            ? "Selesai"
                            : order.status === "cancelled"
                              ? "Dibatalkan"
                              : "Menunggu"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-xl font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}
