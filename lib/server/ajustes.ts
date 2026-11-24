import "server-only";
import { supabasePublico } from "@/lib/server/supabase";
import { CLAVE_HERO, HERO_POR_DEFECTO, normalizarHero } from "@/lib/hero";
import type { HeroSlide } from "@/lib/types";

export async function leerHero(): Promise<HeroSlide[]> {
  const sb = supabasePublico();
  if (!sb) return HERO_POR_DEFECTO;
  try {
    const { data } = await sb.from("ajustes").select("valor").eq("clave", CLAVE_HERO).maybeSingle();
    return normalizarHero(data?.valor);
  } catch {
    return HERO_POR_DEFECTO;
  }
}
