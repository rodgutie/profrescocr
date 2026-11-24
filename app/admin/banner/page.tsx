"use client";
import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Copy, ImageUp, Monitor, Plus, Smartphone, Trash2, Move } from "lucide-react";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";
import { HeroSlideView } from "@/components/sitio/HeroSlideView";
import { guardarHero, leerHeroAdmin, subirImagenBanner } from "@/lib/datos";
import { nuevaDiapositiva } from "@/lib/hero";
import { whatsappLink } from "@/lib/config";
import type { HeroSlide } from "@/lib/types";

const DESTINOS = [
  { valor: "/ingresar", texto: "Ingresar / registrarse" },
  { valor: "/#productos", texto: "Productos" },
  { valor: "/#servicios", texto: "Servicios" },
  { valor: "/quienes-somos", texto: "Quiénes somos" },
  { valor: whatsappLink(), texto: "WhatsApp" },
];

function Vista({ s, modo, onMover }: { s: HeroSlide; modo: "escritorio" | "movil"; onMover: (x: number, y: number) => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0.5);
  const arrastre = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const ancho = modo === "escritorio" ? 1280 : 390;
  const alto = modo === "escritorio" ? 540 : 460;

  useEffect(() => {
    if (!caja.current) return;
    const ro = new ResizeObserver(([e]) => setEscala(Math.min(1, e.contentRect.width / ancho)));
    ro.observe(caja.current);
    return () => ro.disconnect();
  }, [ancho]);

  return (
    <div ref={caja} className="w-full">
      <div className="mx-auto overflow-hidden rounded-xl border-4 border-bosque-900 bg-white" style={{ width: ancho * escala + 8, height: alto * escala + 8 }}>
        <div
          className="cursor-grab touch-none active:cursor-grabbing"
          style={{ width: ancho, height: alto, transform: `scale(${escala})`, transformOrigin: "top left" }}
          onPointerDown={(e) => {
            if ((e.target as HTMLElement).closest("a")) e.preventDefault();
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            arrastre.current = { x: e.clientX, y: e.clientY, px: s.posX, py: s.posY };
          }}
          onPointerMove={(e) => {
            const a = arrastre.current;
            if (!a) return;
            const f = 100 / (s.zoom / 100) / escala;
            const nx = Math.max(0, Math.min(100, a.px - ((e.clientX - a.x) / ancho) * f));
            const ny = Math.max(0, Math.min(100, a.py - ((e.clientY - a.y) / alto) * f));
            onMover(Math.round(nx), Math.round(ny));
          }}
          onPointerUp={() => (arrastre.current = null)}
          onClickCapture={(e) => e.preventDefault()}
        >
          <HeroSlideView s={s} />
        </div>
      </div>
    </div>
  );
}

function Rango({ id, etiqueta, valor, min, max, sufijo = "%", onChange }: { id: string; etiqueta: string; valor: number; min: number; max: number; sufijo?: string; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label className="etiqueta" htmlFor={id}>{etiqueta}</label>
        <span className="text-sm font-bold text-tinta-suave">{valor}{sufijo}</span>
      </div>
      <input id={id} type="range" min={min} max={max} value={valor} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[#1f5a1d]" />
    </div>
  );
}

function Opciones<T extends string>({ valor, opciones, onChange, etiqueta }: { valor: T; opciones: [T, string][]; onChange: (v: T) => void; etiqueta: string }) {
  return (
    <fieldset>
      <legend className="etiqueta">{etiqueta}</legend>
      <div className="flex rounded-full border-2 border-linea p-1">
        {opciones.map(([v, t]) => (
          <button key={v} type="button" onClick={() => onChange(v)} aria-pressed={valor === v} className={`flex-1 rounded-full px-3 py-1.5 text-sm font-bold ${valor === v ? "bg-bosque text-white" : "hover:bg-campo"}`}>
            {t}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function Editor() {
  const [slides, setSlides] = useState<HeroSlide[] | null>(null);
  const [sel, setSel] = useState(0);
  const [modo, setModo] = useState<"escritorio" | "movil">("escritorio");
  const [cambios, setCambios] = useState(false);
  const [estado, setEstado] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const archivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    leerHeroAdmin().then(setSlides);
  }, []);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (cambios) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [cambios]);

  if (!slides) return <div className="h-96 animate-pulse rounded-2xl bg-white" />;
  const s = slides[sel] || slides[0];

  const editar = (parcial: Partial<HeroSlide>) => {
    setSlides((l) => l && l.map((x, k) => (k === sel ? { ...x, ...parcial } : x)));
    setCambios(true);
    setEstado(null);
  };
  const mover = (k: number, d: number) => {
    const j = k + d;
    if (j < 0 || j >= slides.length) return;
    const n = [...slides];
    [n[k], n[j]] = [n[j], n[k]];
    setSlides(n);
    setSel(j);
    setCambios(true);
  };

  async function subir(f: File | undefined) {
    if (!f) return;
    setOcupado(true);
    setEstado(null);
    try {
      editar({ imagen: await subirImagenBanner(f) });
    } catch (e) {
      setEstado({ tipo: "error", texto: (e as Error).message });
    } finally {
      setOcupado(false);
      if (archivo.current) archivo.current.value = "";
    }
  }

  async function publicar() {
    setOcupado(true);
    try {
      await guardarHero(slides!);
      setCambios(false);
      setEstado({ tipo: "ok", texto: "Banner publicado. Ya se ve en la página de inicio." });
    } catch (e) {
      setEstado({ tipo: "error", texto: (e as Error).message });
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-bosque">Banner principal</h1>
          <p className="text-tinta-suave">Las diapositivas rotan en la parte superior de la página de inicio.</p>
        </div>
        <div className="flex items-center gap-3">
          {cambios && <span className="text-sm font-bold text-barro">Cambios sin publicar</span>}
          <button className="btn btn-borde btn-sm" disabled={!cambios || ocupado} onClick={() => leerHeroAdmin().then((v) => { setSlides(v); setCambios(false); setSel(0); })}>
            Descartar
          </button>
          <button className="btn btn-accion" disabled={!cambios || ocupado} onClick={publicar}>
            {ocupado ? "Guardando…" : "Publicar cambios"}
          </button>
        </div>
      </div>
      {estado && (
        <p className={`mt-4 rounded-xl p-3 font-bold ${estado.tipo === "ok" ? "bg-brote/50 text-bosque-900" : "bg-red-50 text-red-800"}`} role="status">
          {estado.texto}
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr]">
        {/* Lista de diapositivas */}
        <div>
          <ul className="space-y-2">
            {slides.map((x, k) => (
              <li key={x.id}>
                <div className={`flex items-center gap-2 rounded-2xl border-[3px] bg-white p-2 ${k === sel ? "border-bosque" : "border-transparent"}`}>
                  <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => setSel(k)} aria-current={k === sel}>
                    <span className="h-12 w-16 shrink-0 overflow-hidden rounded-lg" style={{ background: x.fondo }}>
                      {x.imagen && <img src={x.imagen} alt="" className="h-full w-full object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-extrabold">{x.titulo || "(sin título)"}</span>
                      <span className="flex gap-1.5 text-xs text-tinta-suave">
                        {!x.activo ? "Oculto" : (
                          <>
                            {x.enEscritorio && <Monitor size={13} aria-label="Escritorio" />}
                            {x.enMovil && <Smartphone size={13} aria-label="Móvil" />}
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                  <div className="flex flex-col">
                    <button onClick={() => mover(k, -1)} disabled={k === 0} className="rounded p-0.5 hover:bg-campo disabled:opacity-30" aria-label="Subir"><ArrowUp size={15} /></button>
                    <button onClick={() => mover(k, 1)} disabled={k === slides.length - 1} className="rounded p-0.5 hover:bg-campo disabled:opacity-30" aria-label="Bajar"><ArrowDown size={15} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <button
            className="btn btn-borde mt-3 w-full"
            onClick={() => {
              setSlides([...slides, nuevaDiapositiva()]);
              setSel(slides.length);
              setCambios(true);
            }}
          >
            <Plus size={16} aria-hidden /> Agregar diapositiva
          </button>
        </div>

        {/* Editor */}
        <div className="min-w-0 space-y-5">
          <div className="rounded-2xl bg-white p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex rounded-full border-2 border-linea p-1">
                {([["escritorio", Monitor, "Escritorio"], ["movil", Smartphone, "Móvil"]] as const).map(([m, I, t]) => (
                  <button key={m} onClick={() => setModo(m)} aria-pressed={modo === m} className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-bold ${modo === m ? "bg-bosque text-white" : ""}`}>
                    <I size={15} aria-hidden /> {t}
                  </button>
                ))}
              </div>
              <p className="flex items-center gap-1.5 text-sm text-tinta-suave"><Move size={14} aria-hidden /> Arrastre la imagen para encuadrarla</p>
            </div>
            {(modo === "escritorio" ? s.enEscritorio : s.enMovil) && s.activo ? null : (
              <p className="mb-3 rounded-xl bg-[#fff1e4] p-2 text-center text-sm font-bold text-barro-700">
                Esta diapositiva no se muestra en {modo === "escritorio" ? "escritorio" : "móvil"}.
              </p>
            )}
            <Vista s={s} modo={modo} onMover={(posX, posY) => editar({ posX, posY })} />
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="space-y-4 rounded-2xl bg-white p-5" aria-labelledby="t-contenido">
              <h2 id="t-contenido" className="text-lg font-black">Texto y botón</h2>
              <div>
                <label className="etiqueta" htmlFor="b-titulo">Título</label>
                <input id="b-titulo" className="campo" value={s.titulo} onChange={(e) => editar({ titulo: e.target.value })} />
              </div>
              <div>
                <label className="etiqueta" htmlFor="b-sub">Subtítulo</label>
                <textarea id="b-sub" className="campo min-h-16" value={s.subtitulo} onChange={(e) => editar({ subtitulo: e.target.value })} />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="etiqueta" htmlFor="b-btn">Texto del botón</label>
                  <input id="b-btn" className="campo" placeholder="Vacío = sin botón" value={s.botonTexto} onChange={(e) => editar({ botonTexto: e.target.value })} />
                </div>
                <div>
                  <label className="etiqueta" htmlFor="b-dest">Destino del botón</label>
                  <input id="b-dest" className="campo" list="destinos" placeholder="/ingresar o https://…" value={s.botonDestino} onChange={(e) => editar({ botonDestino: e.target.value })} />
                  <datalist id="destinos">
                    {DESTINOS.map((d) => <option key={d.valor} value={d.valor}>{d.texto}</option>)}
                  </datalist>
                </div>
              </div>
              <Opciones etiqueta="Alineación del texto (escritorio)" valor={s.alineacion} onChange={(v) => editar({ alineacion: v })} opciones={[["izquierda", "Izquierda"], ["centro", "Centro"], ["derecha", "Derecha"]]} />
              <Opciones etiqueta="Color del texto" valor={s.colorTexto} onChange={(v) => editar({ colorTexto: v })} opciones={[["claro", "Blanco"], ["oscuro", "Verde oscuro"]]} />
              <Rango id="b-osc" etiqueta="Sombra detrás del texto" valor={s.oscurecer} min={0} max={80} onChange={(n) => editar({ oscurecer: n })} />
            </section>

            <section className="space-y-4 rounded-2xl bg-white p-5" aria-labelledby="t-imagen">
              <h2 id="t-imagen" className="text-lg font-black">Imagen</h2>
              <div className="flex flex-wrap gap-2">
                <input ref={archivo} type="file" accept="image/*" className="hidden" onChange={(e) => subir(e.target.files?.[0])} />
                <button className="btn btn-primary btn-sm" onClick={() => archivo.current?.click()} disabled={ocupado}>
                  <ImageUp size={16} aria-hidden /> {ocupado ? "Subiendo…" : "Subir imagen"}
                </button>
                {s.imagen && <button className="btn btn-borde btn-sm" onClick={() => editar({ imagen: "" })}>Quitar imagen</button>}
              </div>
              <p className="ayuda">Recomendado: foto horizontal de al menos 1920 × 800 px. Se optimiza automáticamente.</p>
              <Opciones etiqueta="Ajuste" valor={s.ajuste} onChange={(v) => editar({ ajuste: v })} opciones={[["cubrir", "Llenar el espacio"], ["contener", "Mostrar completa"]]} />
              <Rango id="b-zoom" etiqueta="Tamaño de la imagen" valor={s.zoom} min={50} max={200} onChange={(n) => editar({ zoom: n })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Rango id="b-x" etiqueta="Posición horizontal" valor={s.posX} min={0} max={100} onChange={(n) => editar({ posX: n })} />
                <Rango id="b-y" etiqueta="Posición vertical" valor={s.posY} min={0} max={100} onChange={(n) => editar({ posY: n })} />
              </div>
              <div className="flex items-center gap-3">
                <input id="b-fondo" type="color" value={s.fondo} onChange={(e) => editar({ fondo: e.target.value })} className="h-10 w-14 cursor-pointer rounded-lg border-2 border-linea" />
                <label htmlFor="b-fondo" className="text-sm font-bold">Color de fondo <span className="font-semibold text-tinta-suave">(se ve si la imagen es más pequeña)</span></label>
              </div>
            </section>
          </div>

          <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-white p-5" aria-label="Visibilidad">
            <div className="flex flex-wrap gap-5">
              {([["activo", "Visible"], ["enEscritorio", "Mostrar en escritorio"], ["enMovil", "Mostrar en móvil"]] as const).map(([k, t]) => (
                <label key={k} className="flex cursor-pointer items-center gap-2 font-bold">
                  <input type="checkbox" className="h-5 w-5 accent-[#1f5a1d]" checked={s[k]} onChange={(e) => editar({ [k]: e.target.checked })} />
                  {t}
                </label>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-borde btn-sm"
                onClick={() => {
                  const copia = { ...s, id: nuevaDiapositiva().id, titulo: s.titulo + " (copia)" };
                  setSlides([...slides.slice(0, sel + 1), copia, ...slides.slice(sel + 1)]);
                  setSel(sel + 1);
                  setCambios(true);
                }}
              >
                <Copy size={15} aria-hidden /> Duplicar
              </button>
              <button
                className="btn btn-borde btn-sm text-red-700"
                disabled={slides.length === 1}
                onClick={() => {
                  if (!confirm("¿Eliminar esta diapositiva?")) return;
                  setSlides(slides.filter((_, k) => k !== sel));
                  setSel(Math.max(0, sel - 1));
                  setCambios(true);
                }}
              >
                <Trash2 size={15} aria-hidden /> Eliminar
              </button>
            </div>
          </section>
          <p className="text-sm text-tinta-suave">Consejo: para tener una imagen distinta en móvil, duplique la diapositiva, cambie la foto y deje una solo en escritorio y la otra solo en móvil.</p>
        </div>
      </div>
    </div>
  );
}

export default function AdminBanner() {
  return (
    <PlataformaShell area="admin">
      <Editor />
    </PlataformaShell>
  );
}
