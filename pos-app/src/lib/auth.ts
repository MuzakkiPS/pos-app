
import "server-only";

import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export async function requireAdmin() {
  const supabase = await createClient();

  const { data: { user }, error: authError } =
    await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } =
    await supabase
      .from("users")
      .select("id, username, role")
      .eq("id", user.id)
      .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (profile.role !== "admin") {
    redirect("/pos");
  }

  return { supabase, user, profile };
}


export async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, username, role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    redirect("/login");
  }

  if (!["admin", "cashier"].includes(profile.role)) {
    redirect("/login");
  }

  return { supabase, user, profile };
}
