import type { HeroSlide } from "@/lib/types";

/**
 * Dibuja una diapositiva del banner. Usa "container queries" para que la
 * vista previa del panel de administración (escritorio / móvil) se vea igual que el sitio.
 */
export function HeroSlideView({ s, prioridad = false }: { s: HeroSlide; prioridad?: boolean }) {
  const o = Math.max(0, Math.min(80, s.oscurecer)) / 100;
  const tinte = `rgba(20,60,19,${o})`;
  const degradado =
    s.alineacion === "centro"
      ? `linear-gradient(${tinte}, ${tinte})`
      : `linear-gradient(to ${s.alineacion === "derecha" ? "left" : "right"}, ${tinte} 0%, ${tinte} 35%, rgba(20,60,19,${o * 0.25}) 75%, rgba(20,60,19,0) 100%)`;
  const degradadoMovil = `linear-gradient(to top, rgba(20,60,19,${Math.min(0.9, o + 0.25)}) 0%, rgba(20,60,19,${o * 0.6}) 55%, rgba(20,60,19,${o * 0.2}) 100%)`;
  const claro = s.colorTexto === "claro";
  const alinear =
    s.alineacion === "centro"
      ? "@3xl:items-center @3xl:text-center"
      : s.alineacion === "derecha"
        ? "@3xl:items-end @3xl:text-right"
        : "@3xl:items-start @3xl:text-left";
  const hayTexto = s.titulo || s.subtitulo || s.botonTexto;

  return (
    <div className="@container relative h-full w-full overflow-hidden" style={{ backgroundColor: s.fondo }}>
      {s.imagen && (
        <img
          src={s.imagen}
          alt=""
          fetchPriority={prioridad ? "high" : "auto"}
          loading={prioridad ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full select-none"
          draggable={false}
          style={{
            objectFit: s.ajuste === "contener" ? "contain" : "cover",
            objectPosition: `${s.posX}% ${s.posY}%`,
            transform: `scale(${s.zoom / 100})`,
            transformOrigin: `${s.posX}% ${s.posY}%`,
          }}
        />
      )}
      {hayTexto && o > 0 && (
        <>
          <div className="absolute inset-0 @3xl:hidden" style={{ background: degradadoMovil }} aria-hidden />
          <div className="absolute inset-0 hidden @3xl:block" style={{ background: degradado }} aria-hidden />
        </>
      )}
      {hayTexto && (
        <div className="relative mx-auto flex h-full max-w-7xl px-5 @3xl:px-10">
          <div
            className={`flex w-full flex-col justify-end gap-4 pb-14 @3xl:justify-center @3xl:pb-0 ${alinear} ${claro ? "text-white" : "text-bosque-900"}`}
          >
            {s.titulo && (
              <h2 className="max-w-[16ch] text-[2.1rem] font-black leading-[1.05] @3xl:text-[3.6rem] @6xl:text-[4.2rem]">{s.titulo}</h2>
            )}
            {s.subtitulo && <p className="max-w-[44ch] text-lg font-semibold opacity-95 @3xl:text-xl">{s.subtitulo}</p>}
            {s.botonTexto && (
              <a href={s.botonDestino || "#"} className="btn btn-accion mt-2 px-6 py-3 text-lg">
                {s.botonTexto}
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
