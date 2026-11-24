import type { HeroSlide } from "@/lib/types";

export function nuevaDiapositiva(parcial: Partial<HeroSlide> = {}): HeroSlide {
  return {
    id: Math.random().toString(36).slice(2, 10),
    activo: true,
    enEscritorio: true,
    enMovil: true,
    imagen: "",
    titulo: "Nuevo banner",
    subtitulo: "",
    botonTexto: "",
    botonDestino: "",
    alineacion: "izquierda",
    colorTexto: "claro",
    oscurecer: 35,
    ajuste: "cubrir",
    zoom: 100,
    posX: 50,
    posY: 50,
    fondo: "#1f5a1d",
    ...parcial,
  };
}

export const HERO_POR_DEFECTO: HeroSlide[] = [
  nuevaDiapositiva({
    id: "inicio",
    imagen: "/img/verduras-mix.jpg",
    titulo: "Directo del campo, siempre frescos",
    subtitulo: "Frutas, verduras, huevos y quesos a la puerta de su casa o negocio, de lunes a sábado.",
    botonTexto: "Hacer mi pedido",
    botonDestino: "/ingresar",
    oscurecer: 45,
    posX: 50,
    posY: 45,
  }),
  nuevaDiapositiva({
    id: "negocios",
    imagen: "/img/banner-mercado.jpg",
    titulo: "Para restaurantes, sodas e instituciones",
    subtitulo: "Entregas puntuales de lunes a sábado. Usted cocina, nosotros nos encargamos del mercado.",
    botonTexto: "Ver productos",
    botonDestino: "/#productos",
    alineacion: "izquierda",
    colorTexto: "oscuro",
    oscurecer: 0,
    ajuste: "cubrir",
    enMovil: false,
    posX: 100,
    posY: 50,
    fondo: "#ffffff",
  }),
];

/** Asegura que un valor leído de la base de datos tenga todos los campos. */
export function normalizarHero(valor: unknown): HeroSlide[] {
  if (!Array.isArray(valor) || valor.length === 0) return HERO_POR_DEFECTO;
  return valor.map((v) => nuevaDiapositiva(v as Partial<HeroSlide>));
}

export const CLAVE_HERO = "hero";
export const CLAVE_HERO_LOCAL = "profresco_demo_hero";
