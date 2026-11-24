"use client";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";
import { cambiarPromotorDeCliente, cambiarTipoDeCliente, todosLosClientes, todosLosPedidos } from "@/lib/datos";
import { colones, descargarCSV, fechaCorta } from "@/lib/format";
import type { Pedido, Perfil, TipoCliente } from "@/lib/types";

function Clientes() {
  const [clientes, setClientes] = useState<Perfil[] | null>(null);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    Promise.all([todosLosClientes(), todosLosPedidos()])
      .then(([c, p]) => {
        setClientes(c);
        setPedidos(p);
      })
      .catch((e) => setError((e as Error).message));
  }, []);

  const stats = useMemo(() => {
    const m = new Map<string, { pedidos: number; total: number; ultimo: string }>();
    for (const p of pedidos) {
      if (p.estado === "cancelado") continue;
      const s = m.get(p.user_id) || { pedidos: 0, total: 0, ultimo: "" };
      s.pedidos++;
      s.total += p.total;
      if (p.created_at > s.ultimo) s.ultimo = p.created_at;
      m.set(p.user_id, s);
    }
    return m;
  }, [pedidos]);

  const filtrados = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (clientes || []).filter(
      (c) =>
        (!tipo || c.tipo_cliente === tipo) &&
        (!t || [c.nombre, c.empresa, c.email, c.telefono, c.canton, c.codigo_promotor].join(" ").toLowerCase().includes(t)),
    );
  }, [clientes, q, tipo]);

  async function editarPromotor(c: Perfil) {
    const nuevo = prompt(`Nuevo código de promotor para ${c.nombre}:`, c.codigo_promotor);
    if (!nuevo || nuevo.trim().toUpperCase() === c.codigo_promotor) return;
    try {
      await cambiarPromotorDeCliente(c, nuevo);
      setClientes((l) => l && l.map((x) => (x.id === c.id ? { ...x, codigo_promotor: nuevo.trim().toUpperCase() } : x)));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  async function editarTipo(c: Perfil, t: TipoCliente) {
    try {
      await cambiarTipoDeCliente(c, t);
      setClientes((l) => l && l.map((x) => (x.id === c.id ? { ...x, tipo_cliente: t } : x)));
    } catch (e) {
      alert((e as Error).message);
    }
  }

  const exportar = () =>
    descargarCSV(
      `clientes-${new Date().toISOString().slice(0, 10)}.csv`,
      filtrados.map((c) => ({
        nombre: c.nombre,
        negocio: c.empresa || "",
        cedula: c.cedula || "",
        tipo: c.tipo_cliente,
        correo: c.email,
        telefono: c.telefono,
        provincia: c.provincia,
        canton: c.canton,
        direccion: c.direccion,
        ubicacion: c.ubicacion_url || "",
        promotor: c.codigo_promotor,
        registrado: c.created_at.slice(0, 10),
        pedidos: stats.get(c.id)?.pedidos || 0,
        total_comprado: stats.get(c.id)?.total || 0,
      })),
    );

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-bosque">Clientes</h1>
          <p className="text-tinta-suave">{clientes?.length ?? "…"} clientes registrados.</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={exportar} disabled={!filtrados.length}>
          <Download size={15} aria-hidden /> Exportar CSV
        </button>
      </div>
      <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-[2fr_1fr]">
        <div>
          <label className="etiqueta" htmlFor="c-q">Buscar</label>
          <input id="c-q" className="campo" placeholder="Nombre, negocio, teléfono, cantón, promotor…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="c-tipo">Tipo</label>
          <select id="c-tipo" className="campo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
            <option value="">Todos</option>
            <option value="residencial">Residencial</option>
            <option value="comercial">Institucional / Comercial</option>
          </select>
        </div>
      </div>
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">{error}</p>}
      {!clientes ? (
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-white" />
      ) : filtrados.length === 0 ? (
        <p className="mt-4 rounded-2xl bg-white p-8 text-center text-tinta-suave">{clientes.length ? "Ningún cliente coincide con la búsqueda." : "Todavía no hay clientes registrados."}</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl bg-white">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b-2 border-linea text-left">
                <th className="p-3">Cliente</th>
                <th className="p-3">Contacto</th>
                <th className="p-3">Dirección</th>
                <th className="p-3">Tipo</th>
                <th className="p-3">Promotor</th>
                <th className="p-3 text-right">Compras</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((c) => {
                const s = stats.get(c.id);
                return (
                  <tr key={c.id} className="border-b border-linea align-top">
                    <td className="p-3">
                      <p className="font-bold">{c.empresa || c.nombre}</p>
                      <p className="text-xs text-tinta-suave">{c.empresa ? c.nombre + " · " : ""}Desde {fechaCorta(c.created_at)}</p>
                    </td>
                    <td className="p-3">
                      <a className="font-bold text-bosque underline" href={`https://wa.me/506${c.telefono.replace(/\D/g, "").slice(-8)}`} target="_blank" rel="noreferrer">{c.telefono}</a>
                      <p className="text-xs text-tinta-suave">{c.email}</p>
                    </td>
                    <td className="max-w-[260px] p-3 text-xs">
                      {c.direccion}, {c.canton}, {c.provincia}
                      {c.ubicacion_url && <> · <a className="font-bold text-bosque underline" href={c.ubicacion_url} target="_blank" rel="noreferrer">Mapa</a></>}
                    </td>
                    <td className="p-3">
                      <select className="campo !py-1 text-sm" value={c.tipo_cliente} onChange={(e) => editarTipo(c, e.target.value as TipoCliente)} aria-label={`Tipo de cliente de ${c.nombre}`}>
                        <option value="residencial">Residencial</option>
                        <option value="comercial">Comercial</option>
                      </select>
                    </td>
                    <td className="p-3">
                      <button className="font-black tracking-wide underline decoration-dotted underline-offset-4" onClick={() => editarPromotor(c)} title="Cambiar código">
                        {c.codigo_promotor}
                      </button>
                    </td>
                    <td className="p-3 text-right">
                      <p className="font-black text-barro">{colones(s?.total || 0)}</p>
                      <p className="text-xs text-tinta-suave">{s?.pedidos || 0} pedidos</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminClientes() {
  return (
    <PlataformaShell area="admin">
      <Clientes />
    </PlataformaShell>
  );
}
