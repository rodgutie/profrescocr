const crc = new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC", maximumFractionDigits: 0 });

export function colones(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  return crc.format(Math.round(n));
}

export function fechaCorta(iso: string) {
  if (!iso) return "";
  const d = iso.length === 10 ? new Date(iso + "T12:00:00") : new Date(iso);
  return d.toLocaleDateString("es-CR", { weekday: "short", day: "numeric", month: "short" });
}

export function fechaHora(iso: string) {
  return new Date(iso).toLocaleString("es-CR", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export function numeroPedido(id: number) {
  return "PF-" + String(id).padStart(5, "0");
}

export const ESTADOS: Record<string, { texto: string; clase: string }> = {
  nuevo: { texto: "Recibido", clase: "bg-brote/60 text-bosque-900" },
  confirmado: { texto: "Confirmado", clase: "bg-hoja text-white" },
  en_ruta: { texto: "En ruta", clase: "bg-barro text-white" },
  entregado: { texto: "Entregado", clase: "bg-bosque text-white" },
  cancelado: { texto: "Cancelado", clase: "bg-neutral-200 text-neutral-600" },
};

export const PROVINCIAS = ["San José", "Alajuela", "Cartago", "Heredia", "Guanacaste", "Puntarenas", "Limón"];

/** Próximas fechas de entrega: lunes a sábado, desde mañana. */
export function proximasFechasEntrega(cantidad = 8): string[] {
  const fechas: string[] = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (fechas.length < cantidad) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      fechas.push(`${y}-${m}-${dd}`);
    }
  }
  return fechas;
}

export function aCSV(filas: Record<string, unknown>[]): string {
  if (!filas.length) return "";
  const cols = Object.keys(filas[0]);
  const esc = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [cols.join(","), ...filas.map((f) => cols.map((c) => esc(f[c])).join(","))].join("\n");
}

export function descargarCSV(nombre: string, filas: Record<string, unknown>[]) {
  const blob = new Blob(["﻿" + aCSV(filas)], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
