import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, IS_DEMO } from "@/lib/config";

const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

let _admin: SupabaseClient | null = null;
/** Cliente con permisos totales. Solo en el servidor. */
export function supabaseAdmin(): SupabaseClient {
  if (IS_DEMO) throw new Error("Supabase no está configurado");
  if (!SERVICE_KEY) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
  if (!_admin) _admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  return _admin;
}

let _anon: SupabaseClient | null = null;
export function supabasePublico(): SupabaseClient | null {
  if (IS_DEMO) return null;
  if (!_anon) _anon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false } });
  return _anon;
}

/** Usuario que hace la petición (token "Authorization: Bearer ..."). */
export async function usuarioDeRequest(req: Request) {
  const pub = supabasePublico();
  if (!pub) return null;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const { data, error } = await pub.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function esAdmin(email: string | undefined | null) {
  if (!email) return false;
  const { data } = await supabaseAdmin().from("admins").select("email").ilike("email", email).maybeSingle();
  return Boolean(data);
}
