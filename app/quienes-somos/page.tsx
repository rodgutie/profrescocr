import Link from "next/link";
import type { Metadata } from "next";
import { Leaf, Clock, HandHeart } from "lucide-react";
import { SiteHeader } from "@/components/sitio/SiteHeader";
import { SiteFooter } from "@/components/sitio/SiteFooter";

export const metadata: Metadata = {
  title: "Quiénes somos",
  description: "ProFresco lleva frutas, verduras, huevos y quesos frescos, comprados directamente al productor nacional, a hogares y negocios de Costa Rica.",
};

const VALORES = [
  { icono: Leaf, titulo: "Frescura", texto: "Compramos cerca del día de entrega para que el producto llegue como salió del campo." },
  { icono: Clock, titulo: "Puntualidad", texto: "Su pedido llega el día acordado. Un negocio no puede esperar por el tomate." },
  { icono: HandHeart, titulo: "Productor nacional", texto: "Trabajamos directo con agricultores costarricenses, sin intermediarios de más." },
];

export default function QuienesSomos() {
  return (
    <>
      <SiteHeader />
      <main>
        <section className="bg-bosque text-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-[1.2fr_1fr] md:py-24">
            <div>
              <h1 className="text-4xl font-black md:text-6xl">Quiénes somos</h1>
              <p className="mt-6 max-w-[52ch] text-xl text-white/90">
                ProFresco nació para que hogares y negocios tengan producto fresco sin perder la mañana en el mercado, la feria o CENADA.
              </p>
            </div>
            <img src="/brand/icono.svg" alt="" className="mx-auto hidden w-56 rounded-[40px] bg-white p-6 md:block" />
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 text-lg md:py-20">
          <h2 className="text-3xl font-black text-bosque">Nuestra historia</h2>
          <div className="mt-5 space-y-5 text-tinta-suave">
            <p>
              Somos una empresa costarricense de distribución de frutas, verduras, huevos y quesos. Compramos directamente a productores
              nacionales y llevamos cada pedido a la puerta de nuestros clientes, de lunes a sábado.
            </p>
            <p>
              Atendemos familias, restaurantes, sodas, hoteles e instituciones. Lo que nos distingue es simple: lo que usted pide es lo
              que llega, fresco y a tiempo.
            </p>
            <p className="rounded-2xl bg-campo p-5 text-base text-tinta">
              <strong>Nota para el equipo:</strong> este texto es un borrador. Reemplácelo con la historia real de ProFresco (año de inicio,
              fundadores, zonas que cubren).
            </p>
          </div>
        </section>

        <section className="bg-campo">
          <div className="mx-auto max-w-7xl px-4 py-16 md:py-20">
            <h2 className="text-3xl font-black text-bosque">Lo que nos mueve</h2>
            <ul className="mt-10 grid gap-6 md:grid-cols-3">
              {VALORES.map(({ icono: Icono, titulo, texto }) => (
                <li key={titulo} className="rounded-3xl bg-white p-7">
                  <Icono className="text-hoja" size={30} aria-hidden />
                  <h3 className="mt-4 text-xl font-extrabold">{titulo}</h3>
                  <p className="mt-2 text-tinta-suave">{texto}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div>
              <h2 className="text-3xl font-black text-bosque">¿Quiere ser cliente?</h2>
              <p className="mt-2 text-lg text-tinta-suave">Cree su cuenta y vea los precios de esta semana.</p>
            </div>
            <Link href="/ingresar" className="btn btn-accion px-6 py-3 text-lg">Crear mi cuenta</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
