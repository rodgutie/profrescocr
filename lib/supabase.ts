"use client";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { IS_DEMO, SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/config";

let cliente: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (IS_DEMO) throw new Error("Modo demo: Supabase no está configurado");
  if (!cliente) {
    cliente = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }
  return cliente;
}
