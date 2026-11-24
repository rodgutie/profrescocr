"use client";
import { useEffect, useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { listaPromotores, todosLosClientes, todosLosPedidos } from "@/lib/datos";
import { colones, descargarCSV } from "@/lib/format";
import type { Pedido, Perfil, Promotor } from "@/lib/types";

function mesActual() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function Promotores() {
  const { sesion } = useAuth();
  const [promotores, setPromotores] = useState<Promotor[] | null>(null);
  const [clientes, setClientes] = useState<Perfil[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [mes, setMes] = useState(mesActual());
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sesion) return;
    Promise.all([listaPromotores(sesion), todosLosClientes(), todosLosPedidos()])
      .then(([pr, c, p]) => {
        setPromotores(pr);
        setClientes(c);
        setPedidos(p);
      })
      .catch((e) => setError((e as Error).message));
  }, [sesion]);

  const meses = useMemo(() => {
    const s = new Set([mesActual(), ...pedidos.map((p) => p.created_at.slice(0, 7))]);
    return [...s].sort().reverse();
  }, [pedidos]);

  const filas = useMemo(() => {
    if (!promotores) return [];
    const codigos = new Set([...promotores.map((p) => p.codigo), ...clientes.map((c) => c.codigo_promotor)]);
    return [...codigos].map((codigo) => {
      const info = promotores.find((p) => p.codigo === codigo);
      const delMes = pedidos.filter((p) => p.codigo_promotor === codigo && p.estado !== "cancelado" && p.created_at.slice(0, 7) === mes);
      const entregados = delMes.filter((p) => p.estado === "entregado");
      const ventas = delMes.reduce((s, p) => s + p.total, 0);
      const ventasEntregadas = entregados.reduce((s, p) => s + p.total, 0);
      const pct = info?.comisionPct || 0;
      return {
        codigo,
        nombre: info?.nombre || "(no está en la lista)",
        activo: info?.activo ?? false,
        pct,
        clientes: clientes.filter((c) => c.codigo_promotor === codigo).length,
        nuevosMes: clientes.filter((c) => c.codigo_promotor === codigo && c.created_at.slice(0, 7) === mes).length,
        pedidos: delMes.length,
        ventas,
        ventasEntregadas,
        comision: Math.round((ventasEntregadas * pct) / 100),
      };
    }).sort((a, b) => b.ventas - a.ventas || a.codigo.localeCompare(b.codigo));
  }, [promotores, clientes, pedidos, mes]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-bosque">Promotores y comisiones</h1>
          <p className="max-w-[70ch] text-tinta-suave">
            La lista de códigos y el % de comisión se editan en la pestaña “Promotores” del Google Sheet. La comisión se calcula sobre pedidos entregados.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="etiqueta" htmlFor="mes">Mes</label>
            <select id="mes" className="campo !py-1.5" value={mes} onChange={(e) => setMes(e.target.value)}>
              {meses.map((m) => (
                <option key={m} value={m}>
                  {new Date(m + "-15").toLocaleDateString("es-CR", { month: "long", year: "numeric" })}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary btn-sm mb-0.5" onClick={() => descargarCSV(`comisiones-${mes}.csv`, filas)} disabled={!filas.length}>
            <Download size={15} aria-hidden /> Exportar CSV
          </button>
        </div>
      </div>
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">{error}</p>}
      {!promotores ? (
        <div className="mt-4 h-48 animate-pulse rounded-2xl bg-white" />
      ) : (
        <div className="mt-5 overflow-x-auto rounded-2xl bg-white">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b-2 border-linea text-left">
                <th className="p-3">Código</th>
                <th className="p-3">Promotor</th>
                <th className="p-3 text-right">Clientes</th>
                <th className="p-3 text-right">Pedidos del mes</th>
                <th className="p-3 text-right">Ventas del mes</th>
                <th className="p-3 text-right">Entregado</th>
                <th className="p-3 text-right">Comisión</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f) => (
                <tr key={f.codigo} className="border-b border-linea">
                  <td className="p-3 font-black tracking-wide">{f.codigo}</td>
                  <td className="p-3">
                    <span className={f.activo ? "font-bold" : "font-bold text-tinta-suave"}>{f.nombre}</span>
                    {!f.activo && <span className="ml-2 rounded-full bg-neutral-200 px-2 py-0.5 text-xs">inactivo</span>}
                  </td>
                  <td className="p-3 text-right">{f.clientes}{f.nuevosMes ? <span className="text-xs text-hoja"> (+{f.nuevosMes})</span> : null}</td>
                  <td className="p-3 text-right">{f.pedidos}</td>
                  <td className="p-3 text-right">{colones(f.ventas)}</td>
                  <td className="p-3 text-right">{colones(f.ventasEntregadas)}</td>
                  <td className="p-3 text-right">
                    <span className="font-black text-barro">{colones(f.comision)}</span>
                    <span className="block text-xs text-tinta-suave">{f.pct}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function AdminPromotores() {
  return (
    <PlataformaShell area="admin">
      <Promotores />
    </PlataformaShell>
  );
}
