export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** Sin Supabase configurado, el sitio funciona en modo demo (datos en el navegador). */
export const IS_DEMO = !(SUPABASE_URL && SUPABASE_ANON_KEY);

export const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || "50688288013";
export const WHATSAPP_VISIBLE = "8828-8013";

export const DEMO_ADMIN_EMAILS = (process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAILS || "admin@profresco.cr")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

export const DEMO_CODE = "123456";

export function whatsappLink(texto?: string) {
  const base = `https://wa.me/${WHATSAPP}`;
  return texto ? `${base}?text=${encodeURIComponent(texto)}` : base;
}
