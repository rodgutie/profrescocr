import { NextResponse } from "next/server";
import { buscarPromotor } from "@/lib/sheets";

export async function GET(req: Request) {
  const codigo = new URL(req.url).searchParams.get("codigo") || "";
  const p = await buscarPromotor(codigo);
  return NextResponse.json({ valido: Boolean(p) }, { headers: { "Cache-Control": "no-store" } });
}
