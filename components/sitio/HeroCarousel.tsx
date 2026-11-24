"use client";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { HeroSlideView } from "@/components/sitio/HeroSlideView";
import { leerHeroLocal } from "@/lib/datos";
import type { HeroSlide } from "@/lib/types";

const INTERVALO = 7000;

function Carrusel({ slides, clase }: { slides: HeroSlide[]; clase: string }) {
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const n = slides.length;
  const ir = useCallback((d: number) => setI((v) => (v + d + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || pausa) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => ir(1), INTERVALO);
    return () => clearInterval(t);
  }, [n, pausa, ir]);

  if (!n) return null;
  return (
    <section
      className={`relative ${clase}`}
      aria-roledescription="carrusel"
      aria-label="Novedades"
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={() => setPausa(false)}
    >
      <div className="relative h-[460px] overflow-hidden md:h-[540px]">
        {slides.map((s, k) => (
          <div
            key={s.id}
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: k === i ? 1 : 0, pointerEvents: k === i ? "auto" : "none" }}
            aria-hidden={k !== i}
            aria-roledescription="diapositiva"
            aria-label={`${k + 1} de ${n}`}
          >
            <HeroSlideView s={s} prioridad={k === 0} />
          </div>
        ))}
      </div>
      {n > 1 && (
        <>
          <button
            onClick={() => ir(-1)}
            className="absolute left-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/85 p-2 text-bosque shadow hover:bg-white md:block"
            aria-label="Banner anterior"
          >
            <ChevronLeft />
          </button>
          <button
            onClick={() => ir(1)}
            className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/85 p-2 text-bosque shadow hover:bg-white md:block"
            aria-label="Banner siguiente"
          >
            <ChevronRight />
          </button>
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {slides.map((s, k) => (
              <button
                key={s.id}
                onClick={() => setI(k)}
                className={`h-2.5 rounded-full transition-all ${k === i ? "w-8 bg-white" : "w-2.5 bg-white/60"}`}
                aria-label={`Ver banner ${k + 1}`}
                aria-current={k === i}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

export function HeroCarousel({ inicial }: { inicial: HeroSlide[] }) {
  const [slides, setSlides] = useState(inicial);

  // En modo demo, el banner editado en /admin se guarda en este navegador.
  useEffect(() => {
    leerHeroLocal().then((v) => v && setSlides(v));
  }, []);

  const activos = slides.filter((s) => s.activo);
  const escritorio = activos.filter((s) => s.enEscritorio);
  const movil = activos.filter((s) => s.enMovil);
  return (
    <>
      <Carrusel slides={escritorio} clase="hidden md:block" />
      <Carrusel slides={movil} clase="md:hidden" />
    </>
  );
}
