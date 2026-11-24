"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { RotateCcw, ChevronDown } from "lucide-react";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { useCarrito } from "@/components/plataforma/Carrito";
import { misPedidos } from "@/lib/datos";
import { colones, ESTADOS, fechaCorta, fechaHora } from "@/lib/format";
import type { Pedido } from "@/lib/types";

function Lista() {
  const router = useRouter();
  const { sesion } = useAuth();
  const { reemplazar } = useCarrito();
  const [pedidos, setPedidos] = useState<Pedido[] | null>(null);
  const [error, setError] = useState("");
  const [abierto, setAbierto] = useState<number | null>(null);

  useEffect(() => {
    if (sesion) misPedidos(sesion).then(setPedidos).catch((e) => setError((e as Error).message));
  }, [sesion]);

  function repetir(p: Pedido) {
    reemplazar(Object.fromEntries(p.items.map((i) => [i.producto_id, i.cantidad])));
    router.push("/tienda");
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-black text-bosque">Mis pedidos</h1>
      {error && <p className="mt-4 rounded-2xl bg-red-50 p-4 font-semibold text-red-800">{error}</p>}
      {!pedidos ? (
        <div className="mt-6 h-40 animate-pulse rounded-2xl bg-white" />
      ) : pedidos.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center">
          <p className="text-tinta-suave">Aún no tiene pedidos.</p>
          <button className="btn btn-primary mt-4" onClick={() => router.push("/tienda")}>Hacer mi primer pedido</button>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {pedidos.map((p) => {
            const e = ESTADOS[p.estado] || ESTADOS.nuevo;
            const ver = abierto === p.id;
            return (
              <li key={p.id} className="rounded-2xl bg-white">
                <button className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 p-4 text-left" onClick={() => setAbierto(ver ? null : p.id)} aria-expanded={ver}>
                  <span className="font-black">{p.numero}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${e.clase}`}>{e.texto}</span>
                  <span className="text-sm text-tinta-suave">Entrega {fechaCorta(p.fecha_entrega)}</span>
                  <span className="ml-auto font-black text-barro">{colones(p.total)}</span>
                  <ChevronDown size={18} className={`transition-transform ${ver ? "rotate-180" : ""}`} aria-hidden />
                </button>
                {ver && (
                  <div className="border-t border-linea p-4">
                    <p className="text-sm text-tinta-suave">Enviado el {fechaHora(p.created_at)}</p>
                    <table className="mt-3 w-full text-sm">
                      <tbody>
                        {p.items.map((i) => (
                          <tr key={i.producto_id} className="border-b border-linea last:border-0">
                            <td className="py-1.5">{i.nombre}</td>
                            <td className="py-1.5 text-tinta-suave">{i.cantidad} {i.unidad}</td>
                            <td className="py-1.5 text-right font-bold">{colones(i.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {p.notas && <p className="mt-3 text-sm"><strong>Notas:</strong> {p.notas}</p>}
                    <button className="btn btn-borde btn-sm mt-4" onClick={() => repetir(p)}>
                      <RotateCcw size={15} aria-hidden /> Repetir este pedido
                    </button>
                    <p className="mt-2 text-xs text-tinta-suave">Se usarán los precios de esta semana.</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function MisPedidos() {
  return (
    <PlataformaShell>
      <Lista />
    </PlataformaShell>
  );
}
