
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/src/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) {
        setError("Email atau password tidak valid.");
        return;
      }

      const { data: profile, error: profileError } =
        await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

      if (profileError || !profile) {
        await supabase.auth.signOut();
        setError("Profil pengguna tidak ditemukan.");
        return;
      }

      router.replace(
        profile.role === "admin" ? "/dashboard" : "/pos"
      );

      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 rounded-2xl bg-white p-8 shadow-lg"
      >
        <div>
          <img src="/images/kasirku.jpeg" alt="Logo" className="mx-auto h-16 w-16 rounded-3xl" />

          <h1 className="text-3xl font-bold text-slate-800">
            KasirKu
          </h1>
          <p className="mt-2 text-slate-500">
            Masuk untuk melanjutkan ke aplikasi.
          </p>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-bold text-black">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 text-black"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-bold text-black"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            autoComplete="current-password"
            className="w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-blue-500 text-black"
          />
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-slate-900 p-3 font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Login"}
        </button>
      </form>
    </main>
  );
}
