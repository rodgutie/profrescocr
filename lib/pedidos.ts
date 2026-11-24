import type { LineaPedido, Producto, TipoCliente } from "@/lib/types";

export function precioPara(p: Producto, tipo: TipoCliente | undefined): number | null {
  if (p.precio != null) return p.precio;
  if (tipo === "comercial") return p.precioComercial ?? p.precioResidencial ?? null;
  return p.precioResidencial ?? null;
}

export function calcularPedido(
  productos: Producto[],
  tipo: TipoCliente,
  pedidos: { producto_id: string; cantidad: number }[],
): { lineas: LineaPedido[]; total: number; error?: string } {
  const porId = new Map(productos.map((p) => [p.id, p]));
  const lineas: LineaPedido[] = [];
  for (const it of pedidos) {
    const p = porId.get(String(it.producto_id));
    const cantidad = Number(it.cantidad);
    if (!p) return { lineas: [], total: 0, error: `Un producto de su carrito ya no está disponible. Revise el carrito e intente de nuevo.` };
    if (!Number.isFinite(cantidad) || cantidad <= 0 || cantidad > 1000)
      return { lineas: [], total: 0, error: `Revise la cantidad de ${p.nombre}.` };
    const precio = precioPara(p, tipo);
    if (precio == null) return { lineas: [], total: 0, error: `${p.nombre} no tiene precio esta semana. Quítelo del carrito para continuar.` };
    const cant = Math.round(cantidad * 100) / 100;
    lineas.push({ producto_id: p.id, nombre: p.nombre, unidad: p.unidad, cantidad: cant, precio, subtotal: Math.round(precio * cant) });
  }
  if (!lineas.length) return { lineas, total: 0, error: "El carrito está vacío." };
  return { lineas, total: lineas.reduce((s, l) => s + l.subtotal, 0) };
}

export function fechaEntregaValida(fecha: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return false;
  const d = new Date(fecha + "T12:00:00");
  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);
  const dias = Math.round((d.getTime() - hoy.getTime()) / 86400000);
  return d.getDay() !== 0 && dias >= 1 && dias <= 30;
}
