"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Download, ChevronDown, ClipboardList, RefreshCw } from "lucide-react";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";
import { cambiarEstado, todosLosPedidos } from "@/lib/datos";
import { colones, descargarCSV, ESTADOS, fechaCorta, fechaHora } from "@/lib/format";
import type { EstadoPedido, Pedido } from "@/lib/types";

const hace = (dias: number) => new Date(Date.now() - dias * 86400000).toISOString();

function Pedidos() {
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState("");
  const [periodo, setPeriodo] = useState(30);
  const [estado, setEstado] = useState<string>("activos");
  const [entrega, setEntrega] = useState<string>("");
  const [q, setQ] = useState("");
  const [abierto, setAbierto] = useState<number | null>(null);
  const [verResumen, setVerResumen] = useState(false);

  const cargar = () => {
    setPedidos(null);
    todosLosPedidos(periodo ? hace(periodo) : undefined).then(setPedidos).catch((e) => setError((e as Error).message));
  };
  useEffect(cargar, [periodo]);

  const fechasEntrega = useMemo(() => [...new Set((pedidos || []).map((p) => p.fecha_entrega))].sort(), [pedidos]);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (pedidos || []).filter(
      (p) =>
        (estado === "todos" || (estado === "activos" ? !["entregado", "cancelado"].includes(p.estado) : p.estado === estado)) &&
        (!entrega || p.fecha_entrega === entrega) &&
        (!t || [p.numero, p.cliente_nombre, p.cliente_empresa, p.cliente_telefono, p.cliente_email, p.codigo_promotor].join(" ").toLowerCase().includes(t)),
    );
  }, [pedidos, estado, entrega, q]);

  const resumen = useMemo(() => {
    const m = new Map<string, { nombre: string; unidad: string; cantidad: number; pedidos: number }>();
    for (const p of filtrados) {
      if (p.estado === "cancelado") continue;
      for (const i of p.items) {
        const r = m.get(i.producto_id) || { nombre: i.nombre, unidad: i.unidad, cantidad: 0, pedidos: 0 };
        r.cantidad += i.cantidad;
        r.pedidos += 1;
        m.set(i.producto_id, r);
      }
    }
    return [...m.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [filtrados]);

  async function cambiar(p: Pedido, nuevo: EstadoPedido) {
    const anterior = p.estado;
    setPedidos((l) => l && l.map((x) => (x.id === p.id ? { ...x, estado: nuevo } : x)));
    try {
      await cambiarEstado(p.id, nuevo);
    } catch (e) {
      setPedidos((l) => l && l.map((x) => (x.id === p.id ? { ...x, estado: anterior } : x)));
      alert((e as Error).message);
    }
  }

  const exportarPedidos = () =>
    descargarCSV(
      `pedidos-${new Date().toISOString().slice(0, 10)}.csv`,
      filtrados.flatMap((p) =>
        p.items.map((i) => ({
          pedido: p.numero,
          creado: fechaHora(p.created_at),
          entrega: p.fecha_entrega,
          estado: ESTADOS[p.estado]?.texto || p.estado,
          cliente: p.cliente_nombre,
          negocio: p.cliente_empresa || "",
          tipo: p.tipo_cliente,
          telefono: p.cliente_telefono,
          correo: p.cliente_email,
          direccion: p.direccion_entrega,
          promotor: p.codigo_promotor,
          producto: i.nombre,
          cantidad: i.cantidad,
          unidad: i.unidad,
          precio: i.precio,
          subtotal: i.subtotal,
          total_pedido: p.total,
          notas: p.notas || "",
        })),
      ),
    );

  const totalFiltrado = filtrados.filter((p) => p.estado !== "cancelado").reduce((s, p) => s + p.total, 0);
  const nuevos = (pedidos || []).filter((p) => p.estado === "nuevo").length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-bosque">Pedidos</h1>
          <p className="text-tinta-suave">{nuevos} {nuevos === 1 ? "pedido nuevo" : "pedidos nuevos"} por confirmar.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-borde btn-sm" onClick={cargar}><RefreshCw size={15} aria-hidden /> Actualizar</button>
          <button className="btn btn-borde btn-sm" onClick={() => setVerResumen((v) => !v)} aria-expanded={verResumen}>
            <ClipboardList size={15} aria-hidden /> Lista de alistado
          </button>
          <button className="btn btn-primary btn-sm" onClick={exportarPedidos} disabled={!filtrados.length}>
            <Download size={15} aria-hidden /> Exportar CSV
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className="etiqueta" htmlFor="f-q">Buscar</label>
          <input id="f-q" className="campo" placeholder="Cliente, teléfono, PF-00012…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="f-estado">Estado</label>
          <select id="f-estado" className="campo" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="activos">Por entregar</option>
            <option value="todos">Todos</option>
            {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.texto}</option>)}
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="f-entrega">Fecha de entrega</label>
          <select id="f-entrega" className="campo" value={entrega} onChange={(e) => setEntrega(e.target.value)}>
            <option value="">Todas</option>
            {fechasEntrega.map((f) => <option key={f} value={f}>{fechaCorta(f)}</option>)}
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="f-periodo">Creados en</label>
          <select id="f-periodo" className="campo" value={periodo} onChange={(e) => setPeriodo(Number(e.target.value))}>
            <option value={7}>Últimos 7 días</option>
            <option value={30}>Últimos 30 días</option>
            <option value={90}>Últimos 90 días</option>
            <option value={0}>Todo</option>
          </select>
        </div>
      </div>

      {verResumen && (
        <section className="mt-4 rounded-2xl bg-white p-5" aria-labelledby="resumen-t">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="resumen-t" className="text-xl font-black">
              Lista de alistado {entrega ? `para el ${fechaCorta(entrega)}` : "(todos los pedidos filtrados)"}
            </h2>
            <button className="btn btn-borde btn-sm" onClick={() => descargarCSV(`alistado-${entrega || "filtrado"}.csv`, resumen)} disabled={!resumen.length}>
              <Download size={15} aria-hidden /> CSV
            </button>
          </div>
          <p className="text-sm text-tinta-suave">Suma de cantidades por producto, para compras y empaque. Elija una fecha de entrega arriba.</p>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="border-b-2 border-linea text-left">
                <th className="py-2">Producto</th><th className="py-2 text-right">Cantidad</th><th className="py-2 text-right">En pedidos</th>
              </tr>
            </thead>
            <tbody>
              {resumen.map((r) => (
                <tr key={r.nombre} className="border-b border-linea">
                  <td className="py-1.5 font-bold">{r.nombre}</td>
                  <td className="py-1.5 text-right">{r.cantidad.toLocaleString("es-CR")} {r.unidad}</td>
                  <td className="py-1.5 text-right text-tinta-suave">{r.pedidos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">{error}</p>}
      {!pedidos ? (
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-white" />
      ) : filtrados.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white p-8 text-center text-tinta-suave">No hay pedidos con estos filtros.</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b-2 border-linea text-left">
                <th className="p-3">Pedido</th>
                <th className="p-3">Cliente</th>
                <th className="p-3">Entrega</th>
                <th className="p-3">Promotor</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3">Estado</th>
                <th className="p-3"><span className="sr-only">Detalle</span></th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((p) => {
                const ver = abierto === p.id;
                return (
                  <Fragment key={p.id}>
                    <tr className="border-b border-linea align-top">
                      <td className="p-3">
                        <p className="font-black">{p.numero}</p>
                        <p className="text-xs text-tinta-suave">{fechaHora(p.created_at)}</p>
                      </td>
                      <td className="p-3">
                        <p className="font-bold">{p.cliente_empresa || p.cliente_nombre}</p>
                        <p className="text-xs text-tinta-suave">
                          {p.cliente_empresa ? p.cliente_nombre + " · " : ""}{p.cliente_telefono} · {p.tipo_cliente === "comercial" ? "Comercial" : "Residencial"}
                        </p>
                      </td>
                      <td className="p-3 font-bold">{fechaCorta(p.fecha_entrega)}</td>
                      <td className="p-3 font-bold tracking-wide">{p.codigo_promotor}</td>
                      <td className="p-3 text-right font-black text-barro">{colones(p.total)}</td>
                      <td className="p-3">
                        <select
                          className={`rounded-full px-2.5 py-1 text-sm font-bold ${ESTADOS[p.estado]?.clase}`}
                          value={p.estado}
                          onChange={(e) => cambiar(p, e.target.value as EstadoPedido)}
                          aria-label={`Estado del pedido ${p.numero}`}
                        >
                          {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k} className="bg-white text-tinta">{v.texto}</option>)}
                        </select>
                      </td>
                      <td className="p-3">
                        <button onClick={() => setAbierto(ver ? null : p.id)} aria-expanded={ver} aria-label={`Ver detalle de ${p.numero}`} className="rounded-full p-1 hover:bg-campo">
                          <ChevronDown size={18} className={ver ? "rotate-180" : ""} />
                        </button>
                      </td>
                    </tr>
                    {ver && (
                      <tr className="border-b border-linea bg-campo/60">
                        <td colSpan={7} className="p-4">
                          <div className="grid gap-6 md:grid-cols-[1.3fr_1fr]">
                            <table className="w-full">
                              <tbody>
                                {p.items.map((i) => (
                                  <tr key={i.producto_id} className="border-b border-linea last:border-0">
                                    <td className="py-1">{i.nombre}</td>
                                    <td className="py-1">{i.cantidad} {i.unidad}</td>
                                    <td className="py-1 text-right">{colones(i.precio)}</td>
                                    <td className="py-1 text-right font-bold">{colones(i.subtotal)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <div className="space-y-1">
                              <p><strong>Dirección:</strong> {p.direccion_entrega}</p>
                              <p><strong>Correo:</strong> {p.cliente_email}</p>
                              {p.notas && <p><strong>Notas:</strong> {p.notas}</p>}
                              <a className="btn btn-borde btn-sm mt-2" href={`https://wa.me/506${p.cliente_telefono.replace(/\D/g, "").slice(-8)}`} target="_blank" rel="noreferrer">
                                WhatsApp al cliente
                              </a>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={4} className="p-3 text-right font-bold">{filtrados.length} pedidos · total sin cancelados</td>
                <td className="p-3 text-right font-black text-bosque">{colones(totalFiltrado)}</td>
                <td colSpan={2} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPedidos() {
  return (
    <PlataformaShell area="admin">
      <Pedidos />
    </PlataformaShell>
  );
}
