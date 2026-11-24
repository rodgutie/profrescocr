import { NextResponse } from "next/server";
import { IS_DEMO } from "@/lib/config";
import { leerProductos } from "@/lib/sheets";
import { supabaseAdmin, usuarioDeRequest } from "@/lib/server/supabase";
import { calcularPedido, fechaEntregaValida } from "@/lib/pedidos";
import { numeroPedido } from "@/lib/format";
import type { Pedido, TipoCliente } from "@/lib/types";

/** Crea un pedido. Los precios SIEMPRE se calculan aquí, con el Google Sheet vigente. */
export async function POST(req: Request) {
  if (IS_DEMO) return NextResponse.json({ error: "Modo demo" }, { status: 400 });
  const user = await usuarioDeRequest(req);
  if (!user) return NextResponse.json({ error: "Su sesión venció. Ingrese de nuevo." }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const sb = supabaseAdmin();
  const { data: perfil } = await sb.from("perfiles").select("*").eq("id", user.id).maybeSingle();
  if (!perfil) return NextResponse.json({ error: "Complete su registro antes de pedir." }, { status: 400 });

  const fecha = String(b.fecha_entrega || "");
  if (!fechaEntregaValida(fecha)) return NextResponse.json({ error: "Elija una fecha de entrega de lunes a sábado." }, { status: 400 });

  const items = Array.isArray(b.items) ? b.items.slice(0, 200) : [];
  const calculo = calcularPedido(await leerProductos(), perfil.tipo_cliente as TipoCliente, items);
  if (calculo.error) return NextResponse.json({ error: calculo.error }, { status: 400 });

  const direccion = [perfil.direccion, perfil.canton, perfil.provincia].filter(Boolean).join(", ");
  const { data, error } = await sb
    .from("pedidos")
    .insert({
      user_id: user.id,
      fecha_entrega: fecha,
      notas: typeof b.notas === "string" ? b.notas.trim().slice(0, 1000) || null : null,
      tipo_cliente: perfil.tipo_cliente,
      cliente_nombre: perfil.nombre,
      cliente_email: perfil.email,
      cliente_telefono: perfil.telefono,
      cliente_empresa: perfil.empresa,
      direccion_entrega: direccion + (perfil.ubicacion_url ? ` (${perfil.ubicacion_url})` : ""),
      codigo_promotor: perfil.codigo_promotor,
      items: calculo.lineas,
      total: calculo.total,
    })
    .select()
    .single();
  if (error || !data) {
    console.error("[pedidos]", error);
    return NextResponse.json({ error: "No se pudo registrar el pedido. Intente de nuevo." }, { status: 500 });
  }
  const pedido: Pedido = { ...data, total: Number(data.total), numero: numeroPedido(data.id) };

  await enviarAGoogleSheets(pedido);
  return NextResponse.json({ pedido });
}

/** Copia el pedido a Google Sheets (opcional) mediante un Apps Script. */
async function enviarAGoogleSheets(p: Pedido) {
  const url = process.env.PEDIDOS_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ secreto: process.env.PEDIDOS_WEBHOOK_SECRET || "", pedido: p }),
      signal: AbortSignal.timeout(8000),
    });
  } catch (e) {
    console.error("[pedidos] No se pudo copiar a Google Sheets", e);
  }
}
