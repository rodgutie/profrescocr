import { NextResponse } from "next/server";
import { IS_DEMO } from "@/lib/config";
import { leerPromotores } from "@/lib/sheets";
import { esAdmin, usuarioDeRequest } from "@/lib/server/supabase";

export const dynamic = "force-dynamic";

/** Lista completa de promotores (con % de comisión). Solo administradores. */
export async function GET(req: Request) {
  if (!IS_DEMO) {
    const user = await usuarioDeRequest(req);
    if (!user || !(await esAdmin(user.email))) return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }
  return NextResponse.json({ promotores: await leerPromotores() }, { headers: { "Cache-Control": "no-store" } });
}
