import { NextResponse } from "next/server";
import { IS_DEMO } from "@/lib/config";
import { leerProductos } from "@/lib/sheets";
import { esAdmin, supabaseAdmin, usuarioDeRequest } from "@/lib/server/supabase";
import type { Producto } from "@/lib/types";

export const dynamic = "force-dynamic";

const sinPrecios = (ps: Producto[]) => ps.map(({ precioResidencial, precioComercial, ...p }) => p);

export async function GET(req: Request) {
  const productos = await leerProductos();

  // Modo demo: no hay sesiones reales, el navegador decide qué precio mostrar.
  if (IS_DEMO) return NextResponse.json({ productos, modo: "demo" });

  const user = await usuarioDeRequest(req);
  if (!user) return NextResponse.json({ productos: sinPrecios(productos) });

  const headers = { "Cache-Control": "private, no-store" };
  if (await esAdmin(user.email)) return NextResponse.json({ productos, admin: true }, { headers });

  const { data: perfil } = await supabaseAdmin().from("perfiles").select("tipo_cliente").eq("id", user.id).maybeSingle();
  if (!perfil) return NextResponse.json({ productos: sinPrecios(productos) }, { headers });

  const conPrecio = productos.map(({ precioResidencial, precioComercial, ...p }) => ({
    ...p,
    precio: perfil.tipo_cliente === "comercial" ? (precioComercial ?? precioResidencial) : precioResidencial,
  }));
  return NextResponse.json({ productos: conPrecio }, { headers });
}
