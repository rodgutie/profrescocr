"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Minus, Plus, ShoppingBasket, X, CheckCircle2, MapPin, MessageCircle } from "lucide-react";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { useCarrito, pasoDe } from "@/components/plataforma/Carrito";
import { FotoProducto } from "@/components/sitio/FotoProducto";
import { cargarProductos, crearPedido } from "@/lib/datos";
import { colones, fechaCorta, proximasFechasEntrega } from "@/lib/format";
import { precioPara } from "@/lib/pedidos";
import { whatsappLink } from "@/lib/config";
import type { Pedido, Producto } from "@/lib/types";

function fmtCant(n: number) {
  return n.toLocaleString("es-CR", { maximumFractionDigits: 2 });
}

function Stepper({ p, grande = false }: { p: Producto; grande?: boolean }) {
  const { cantidad, poner } = useCarrito();
  const c = cantidad(p.id);
  const paso = pasoDe(p.unidad);
  if (!c) {
    return (
      <button onClick={() => poner(p.id, paso === 0.5 ? 1 : 1)} className={`btn btn-primary w-full ${grande ? "" : "btn-sm"}`}>
        <Plus size={16} aria-hidden /> Agregar
      </button>
    );
  }
  return (
    <div className="flex w-full items-center justify-between rounded-full bg-bosque text-white">
      <button className="grid h-9 w-10 place-items-center rounded-full hover:bg-bosque-900" onClick={() => poner(p.id, c - paso)} aria-label={`Quitar ${paso} ${p.unidad} de ${p.nombre}`}>
        <Minus size={16} />
      </button>
      <span className="text-sm font-extrabold" aria-live="polite">
        {fmtCant(c)} {p.unidad}
      </span>
      <button className="grid h-9 w-10 place-items-center rounded-full hover:bg-bosque-900" onClick={() => poner(p.id, c + paso)} aria-label={`Agregar ${paso} ${p.unidad} de ${p.nombre}`}>
        <Plus size={16} />
      </button>
    </div>
  );
}

function PanelCarrito({ productos, alEnviar, cerrar }: { productos: Producto[]; alEnviar: (p: Pedido) => void; cerrar?: () => void }) {
  const { sesion, perfil } = useAuth();
  const { items, poner, vaciar } = useCarrito();
  const fechas = useMemo(() => proximasFechasEntrega(10), []);
  const [fecha, setFecha] = useState(fechas[0]);
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);

  const porId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);
  const lineas = Object.entries(items)
    .map(([id, cant]) => ({ p: porId.get(id), cant }))
    .filter((l): l is { p: Producto; cant: number } => Boolean(l.p));
  const total = lineas.reduce((s, l) => s + (precioPara(l.p, perfil?.tipo_cliente) || 0) * l.cant, 0);
  const noDisponibles = Object.keys(items).filter((id) => !porId.has(id));

  async function enviar() {
    if (!sesion || !perfil) return;
    setError("");
    setOcupado(true);
    try {
      const pedido = await crearPedido(sesion, perfil, {
        items: lineas.map((l) => ({ producto_id: l.p.id, cantidad: l.cant })),
        fecha_entrega: fecha,
        notas,
      });
      vaciar();
      setNotas("");
      alEnviar(pedido);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-linea px-5 py-4">
        <h2 className="text-xl font-black text-bosque">Su pedido</h2>
        {cerrar && (
          <button onClick={cerrar} className="rounded-full p-1.5 hover:bg-campo" aria-label="Cerrar pedido">
            <X />
          </button>
        )}
      </div>
      {lineas.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-tinta-suave">
          <ShoppingBasket size={40} className="text-hoja" aria-hidden />
          <p>Su pedido está vacío. Toque “Agregar” en los productos que necesite.</p>
        </div>
      ) : (
        <>
          <ul className="flex-1 divide-y divide-linea overflow-y-auto px-5">
            {lineas.map(({ p, cant }) => {
              const precio = precioPara(p, perfil?.tipo_cliente) || 0;
              return (
                <li key={p.id} className="flex items-center gap-3 py-3">
                  <FotoProducto src={p.imagen} nombre={p.nombre} categoria={p.categoria} className="h-12 w-12 shrink-0 rounded-xl" tamIcono="text-2xl" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-extrabold leading-tight">{p.nombre}</p>
                    <p className="text-sm text-tinta-suave">
                      {fmtCant(cant)} {p.unidad} × {colones(precio)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-extrabold">{colones(precio * cant)}</p>
                    <button className="text-sm font-bold text-tinta-suave underline hover:text-red-700" onClick={() => poner(p.id, 0)}>
                      Quitar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="space-y-4 border-t border-linea px-5 py-4">
            {noDisponibles.length > 0 && (
              <p className="rounded-xl bg-[#fff1e4] p-3 text-sm font-semibold text-barro-700">
                {noDisponibles.length === 1 ? "Un producto" : `${noDisponibles.length} productos`} de su carrito ya no está disponible esta semana y no se incluirá.
              </p>
            )}
            <div>
              <label className="etiqueta" htmlFor="fecha">Fecha de entrega</label>
              <select id="fecha" className="campo" value={fecha} onChange={(e) => setFecha(e.target.value)}>
                {fechas.map((f) => (
                  <option key={f} value={f}>{fechaCorta(f)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="etiqueta" htmlFor="notas">Notas para la entrega</label>
              <textarea id="notas" className="campo min-h-16" placeholder="Ej.: tomates no tan maduros, entregar antes de las 10 a. m." value={notas} onChange={(e) => setNotas(e.target.value)} />
            </div>
            <p className="flex items-start gap-2 text-sm text-tinta-suave">
              <MapPin size={16} className="mt-0.5 shrink-0" aria-hidden />
              <span>
                {perfil?.direccion}, {perfil?.canton}.{" "}
                <Link href="/tienda/perfil" className="font-bold text-bosque underline">Cambiar</Link>
              </span>
            </p>
            <div className="flex items-baseline justify-between">
              <span className="font-bold">Total estimado</span>
              <span className="text-2xl font-black text-barro">{colones(total)}</span>
            </div>
            <p className="text-xs text-tinta-suave">En productos por peso el total final puede variar levemente.</p>
            {error && <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-800" role="alert">{error}</p>}
            <button className="btn btn-accion w-full py-3 text-lg" onClick={enviar} disabled={ocupado}>
              {ocupado ? "Enviando…" : "Enviar pedido"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function Confirmacion({ pedido, cerrar }: { pedido: Pedido; cerrar: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const texto = `Hola ProFresco, acabo de enviar el pedido ${pedido.numero} para el ${fechaCorta(pedido.fecha_entrega)}. Total estimado: ${colones(pedido.total)}.`;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-bosque-900/60 p-4" role="dialog" aria-modal="true" aria-labelledby="conf-titulo">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 text-center">
        <CheckCircle2 size={56} className="mx-auto text-hoja" aria-hidden />
        <h2 id="conf-titulo" className="mt-4 text-2xl font-black text-bosque">Pedido {pedido.numero} recibido</h2>
        <p className="mt-2 text-tinta-suave">
          Lo entregamos el <strong className="text-tinta">{fechaCorta(pedido.fecha_entrega)}</strong>. Total estimado{" "}
          <strong className="text-tinta">{colones(pedido.total)}</strong>.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/tienda/pedidos" className="btn btn-primary">Ver mis pedidos</Link>
          <a href={whatsappLink(texto)} className="btn btn-borde"><MessageCircle size={18} aria-hidden /> Avisar por WhatsApp</a>
          <button ref={ref} onClick={cerrar} className="font-bold text-bosque underline underline-offset-4">Seguir comprando</button>
        </div>
      </div>
    </div>
  );
}

function Catalogo() {
  const { sesion, perfil } = useAuth();
  const { totalLineas, items } = useCarrito();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [error, setError] = useState("");
  const [buscar, setBuscar] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [cajonAbierto, setCajon] = useState(false);
  const [confirmado, setConfirmado] = useState<Pedido | null>(null);

  useEffect(() => {
    cargarProductos(sesion).then(setProductos).catch((e) => setError((e as Error).message));
  }, [sesion]);

  const categorias = useMemo(() => [...new Set((productos || []).map((p) => p.categoria))], [productos]);
  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    return (productos || []).filter(
      (p) =>
        (!cat || p.categoria === cat) &&
        (!q || (p.nombre + " " + p.categoria).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(q)),
    );
  }, [productos, buscar, cat]);
  const grupos = useMemo(() => {
    const m = new Map<string, Producto[]>();
    for (const p of filtrados) m.set(p.categoria, [...(m.get(p.categoria) || []), p]);
    return [...m.entries()];
  }, [filtrados]);

  const total = (productos || []).reduce((s, p) => s + (precioPara(p, perfil?.tipo_cliente) || 0) * (items[p.id] || 0), 0);

  if (error) return <p className="rounded-2xl bg-red-50 p-6 font-semibold text-red-800">{error}</p>;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
      <div>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-black text-bosque">Hola, {perfil?.nombre.split(" ")[0]}</h1>
            <p className="text-tinta-suave">
              Precios de esta semana para {perfil?.tipo_cliente === "comercial" ? "comercio e instituciones" : "hogar"}. Entregas de lunes a sábado.
            </p>
          </div>
        </div>

        <div className="sticky top-[7.2rem] z-20 -mx-4 mt-5 bg-campo/95 px-4 pb-3 pt-2 backdrop-blur">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-tinta-suave" size={20} aria-hidden />
            <input
              className="campo pl-11"
              type="search"
              placeholder="Buscar tomate, huevos, culantro…"
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              aria-label="Buscar productos"
            />
          </div>
          <div className="carril mt-3 auto-cols-max gap-2">
            {[null, ...categorias].map((c) => (
              <button
                key={c || "todas"}
                onClick={() => setCat(c)}
                aria-pressed={cat === c}
                className={`rounded-full border-2 px-4 py-1.5 text-sm font-bold ${cat === c ? "border-bosque bg-bosque text-white" : "border-linea bg-white hover:border-hoja"}`}
              >
                {c || "Todo"}
              </button>
            ))}
          </div>
        </div>

        {!productos ? (
          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4" aria-hidden>
            {Array.from({ length: 8 }).map((_, k) => <li key={k} className="h-72 animate-pulse rounded-2xl bg-white" />)}
          </ul>
        ) : grupos.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-white p-8 text-center text-tinta-suave">No encontramos “{buscar}”. Pruebe con otra palabra o escríbanos por WhatsApp.</p>
        ) : (
          grupos.map(([categoria, lista]) => (
            <section key={categoria} className="mt-6" aria-labelledby={`cat-${categoria}`}>
              <h2 id={`cat-${categoria}`} className="mb-3 text-xl font-black">{categoria}</h2>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-4">
                {lista.map((p) => {
                  const precio = precioPara(p, perfil?.tipo_cliente);
                  return (
                    <li key={p.id} className="flex flex-col overflow-hidden rounded-2xl bg-white">
                      <FotoProducto src={p.imagen} nombre={p.nombre} categoria={p.categoria} className="aspect-square w-full" />
                      <div className="flex flex-1 flex-col p-3">
                        <p className="font-extrabold leading-snug">{p.nombre}</p>
                        {p.descripcion && <p className="mt-0.5 line-clamp-2 text-xs text-tinta-suave">{p.descripcion}</p>}
                        <p className="mt-auto pt-2">
                          <span className="text-lg font-black text-barro">{colones(precio)}</span>
                          <span className="text-sm text-tinta-suave"> / {p.unidad}</span>
                        </p>
                        <div className="mt-2">{precio != null ? <Stepper p={p} /> : <p className="text-sm text-tinta-suave">Sin precio esta semana</p>}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* Carrito: columna en escritorio */}
      <aside className="hidden lg:block">
        <div className="sticky top-[7.6rem] h-[calc(100vh-9rem)] overflow-hidden rounded-[24px] bg-white">
          <PanelCarrito productos={productos || []} alEnviar={setConfirmado} />
        </div>
      </aside>

      {/* Carrito: barra y cajón en móvil */}
      {totalLineas > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-linea bg-white p-3 lg:hidden">
          <button className="btn btn-accion w-full justify-between py-3 text-lg" onClick={() => setCajon(true)}>
            <span className="flex items-center gap-2"><ShoppingBasket size={20} aria-hidden /> Ver pedido ({totalLineas})</span>
            <span>{colones(total)}</span>
          </button>
        </div>
      )}
      {cajonAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Su pedido">
          <div className="absolute inset-0 bg-bosque-900/50" onClick={() => setCajon(false)} />
          <div className="absolute inset-x-0 bottom-0 h-[88vh] rounded-t-[28px] bg-white">
            <PanelCarrito
              productos={productos || []}
              cerrar={() => setCajon(false)}
              alEnviar={(p) => {
                setCajon(false);
                setConfirmado(p);
              }}
            />
          </div>
        </div>
      )}
      {totalLineas > 0 && <div className="h-20 lg:hidden" />}
      {confirmado && <Confirmacion pedido={confirmado} cerrar={() => setConfirmado(null)} />}
    </div>
  );
}

export default function Tienda() {
  return (
    <PlataformaShell>
      <Catalogo />
    </PlataformaShell>
  );
}
