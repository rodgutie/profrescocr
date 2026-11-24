import { NextResponse } from "next/server";
import { IS_DEMO } from "@/lib/config";
import { buscarPromotor } from "@/lib/sheets";
import { esAdmin, supabaseAdmin, usuarioDeRequest } from "@/lib/server/supabase";

const txt = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Crea o actualiza el perfil del cliente que inició sesión. */
export async function POST(req: Request) {
  if (IS_DEMO) return NextResponse.json({ error: "Modo demo" }, { status: 400 });
  const user = await usuarioDeRequest(req);
  if (!user) return NextResponse.json({ error: "Su sesión venció. Ingrese de nuevo." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const datos = {
    nombre: txt(b.nombre, 120),
    telefono: txt(b.telefono, 30),
    tipo_cliente: b.tipo_cliente === "comercial" ? "comercial" : b.tipo_cliente === "residencial" ? "residencial" : "",
    empresa: txt(b.empresa, 150) || null,
    cedula: txt(b.cedula, 30) || null,
    provincia: txt(b.provincia, 40),
    canton: txt(b.canton, 80),
    direccion: txt(b.direccion, 500),
    ubicacion_url: txt(b.ubicacion_url, 500) || null,
  };
  const faltan = (["nombre", "telefono", "tipo_cliente", "provincia", "canton", "direccion"] as const).filter((k) => !datos[k]);
  if (faltan.length) return NextResponse.json({ error: "Complete los campos obligatorios." }, { status: 400 });

  const sb = supabaseAdmin();
  const { data: existente } = await sb.from("perfiles").select("codigo_promotor, tipo_cliente").eq("id", user.id).maybeSingle();
  // El tipo de cliente define los precios: después del registro solo lo cambia un administrador.
  if (existente) datos.tipo_cliente = existente.tipo_cliente;

  // El código de promotor se fija en el registro. Después solo un administrador lo puede cambiar.
  let codigo = existente?.codigo_promotor as string | undefined;
  if (!codigo || (b.codigo_promotor && (await esAdmin(user.email)))) {
    const p = await buscarPromotor(txt(b.codigo_promotor, 40));
    if (!p) return NextResponse.json({ error: "El código de promotor no existe. Revíselo con la persona que lo refirió." }, { status: 400 });
    codigo = p.codigo;
  }

  const { data, error } = await sb
    .from("perfiles")
    .upsert({ id: user.id, email: user.email, ...datos, codigo_promotor: codigo, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) {
    console.error("[perfil]", error);
    return NextResponse.json({ error: "No se pudo guardar el perfil. Intente de nuevo." }, { status: 500 });
  }
  return NextResponse.json({ perfil: data });
}
