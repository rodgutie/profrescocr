import "server-only";
import Papa from "papaparse";
import { PRODUCTOS_EJEMPLO_CSV, PROMOTORES_EJEMPLO_CSV } from "@/data/ejemplo";
import { resolverImagen } from "@/lib/images";
import type { Producto, Promotor } from "@/lib/types";

/** Cada cuántos segundos se vuelve a leer el Google Sheet. */
const REFRESCO_SEGUNDOS = 120;

const URL_PRODUCTOS = process.env.SHEET_PRODUCTOS_CSV_URL || "";
const URL_PROMOTORES = process.env.SHEET_PROMOTORES_CSV_URL || "";

export const SHEETS_CONFIGURADO = Boolean(URL_PRODUCTOS);

async function leerCSV(url: string, respaldo: string): Promise<Record<string, string>[]> {
  let texto = respaldo;
  if (url) {
    try {
      const res = await fetch(url, { next: { revalidate: REFRESCO_SEGUNDOS } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      texto = await res.text();
    } catch (e) {
      console.error("[sheets] No se pudo leer", url, e);
      return [];
    }
  }
  const { data } = Papa.parse<Record<string, string>>(texto.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) =>
      h
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_|_$/g, ""),
  });
  return data;
}

/** "₡1,200.00", "1200", "1.200" → 1200 */
export function aNumero(v: string | undefined): number | null {
  if (v == null) return null;
  let s = String(v).replace(/[^\d.,-]/g, "");
  if (!s) return null;
  if (s.includes(",") && s.includes(".")) {
    s = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (s.includes(",")) {
    s = /,\d{3}$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if (/\.\d{3}$/.test(s) && s.split(".").length >= 2) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function siNo(v: string | undefined, porDefecto: boolean): boolean {
  const s = (v || "").trim().toLowerCase();
  if (!s) return porDefecto;
  return ["si", "sí", "s", "yes", "y", "true", "verdadero", "1", "x"].includes(s);
}

/** Todos los productos activos, con precios. Solo para uso en el servidor. */
export async function leerProductos(): Promise<Producto[]> {
  const filas = await leerCSV(URL_PRODUCTOS, PRODUCTOS_EJEMPLO_CSV);
  return filas
    .filter((f) => (f.nombre || "").trim() && siNo(f.activo, true))
    .map((f, i) => ({
      id: (f.id || f.codigo || f.nombre).trim(),
      nombre: f.nombre.trim(),
      categoria: (f.categoria || "Otros").trim(),
      unidad: (f.unidad || "unidad").trim(),
      descripcion: (f.descripcion || "").trim(),
      imagen: resolverImagen(f.imagen || f.foto),
      destacado: siNo(f.destacado, false),
      orden: aNumero(f.orden) ?? 1000 + i,
      precioResidencial: aNumero(f.precio_residencial ?? f.precio),
      precioComercial: aNumero(f.precio_comercial) ?? aNumero(f.precio_residencial ?? f.precio),
    }))
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, "es"));
}

/** Productos sin precios, para la página pública. */
export async function leerProductosPublicos(): Promise<Producto[]> {
  const productos = await leerProductos();
  return productos.map(({ precioResidencial, precioComercial, ...resto }) => resto);
}

export async function leerPromotores(): Promise<Promotor[]> {
  const filas = await leerCSV(URL_PROMOTORES, PROMOTORES_EJEMPLO_CSV);
  return filas
    .filter((f) => (f.codigo || "").trim())
    .map((f) => ({
      codigo: f.codigo.trim().toUpperCase(),
      nombre: (f.nombre || "").trim(),
      comisionPct: aNumero(f.comision_pct ?? f.comision) ?? 0,
      activo: siNo(f.activo, true),
    }));
}

export async function buscarPromotor(codigo: string): Promise<Promotor | null> {
  const c = codigo.trim().toUpperCase();
  if (!c) return null;
  const lista = await leerPromotores();
  return lista.find((p) => p.codigo === c && p.activo) || null;
}
