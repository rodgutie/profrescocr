import Link from "next/link";
import { Truck, Sprout, Home, Store, MessageCircle } from "lucide-react";
import { SiteHeader } from "@/components/sitio/SiteHeader";
import { SiteFooter } from "@/components/sitio/SiteFooter";
import { HeroCarousel } from "@/components/sitio/HeroCarousel";
import { CatalogoPublico } from "@/components/sitio/CatalogoPublico";
import { leerHero } from "@/lib/server/ajustes";
import { leerProductosPublicos } from "@/lib/sheets";
import { whatsappLink } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function Inicio() {
  const [hero, productos] = await Promise.all([leerHero(), leerProductosPublicos()]);

  return (
    <>
      <SiteHeader />
      <main>
        <HeroCarousel inicial={hero} />

        {/* Productos */}
        <section id="productos" className="scroll-mt-28 mx-auto max-w-7xl px-4 py-16 md:py-20">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-3xl font-black text-bosque md:text-[2.6rem]">Lo que llevamos a su puerta</h2>
            <p className="mt-3 text-lg text-tinta-suave">
              Cosecha de temporada que compramos directamente a productores de todo el país. El catálogo cambia cada semana.
            </p>
          </div>
          <CatalogoPublico productos={productos} />
        </section>

        {/* Servicios */}
        <section id="servicios" className="scroll-mt-28 bg-campo">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:gap-14 md:py-24">
            <div className="relative">
              <img
                src="/img/verduras-mix.jpg"
                alt="Verduras y frutas frescas: zanahorias, tomates, brócoli, chiles, berenjena y repollo"
                className="aspect-[4/3] w-full rounded-[36px] object-cover"
                loading="lazy"
              />
              <div className="absolute -bottom-6 right-4 flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg md:right-[-1.5rem]">
                <Truck className="text-barro" aria-hidden />
                <p className="font-extrabold leading-tight text-bosque">
                  Lunes a sábado
                  <span className="block text-sm font-semibold text-tinta-suave">a su casa o negocio</span>
                </p>
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-bosque md:text-[2.6rem]">Nuestros servicios</h2>
              <div className="mt-8 space-y-7">
                <div className="flex gap-4">
                  <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-bosque text-white"><Truck size={22} aria-hidden /></span>
                  <div>
                    <h3 className="text-xl font-extrabold">Le llevamos lo que pidió, siempre fresco y a tiempo</h3>
                    <p className="mt-1 text-tinta-suave">Arme su pedido en línea y lo recibe el día que eligió, sin filas ni vueltas al mercado.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="mt-1 grid h-12 w-12 shrink-0 place-items-center rounded-full bg-hoja text-white"><Sprout size={22} aria-hidden /></span>
                  <div>
                    <h3 className="text-xl font-extrabold">Apoyamos al productor nacional</h3>
                    <p className="mt-1 text-tinta-suave">Compramos directamente al productor y le llevamos los productos más frescos, recién salidos del campo.</p>
                  </div>
                </div>
              </div>
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border-2 border-linea bg-white p-5">
                  <Home className="text-bosque" aria-hidden />
                  <h3 className="mt-3 text-lg font-extrabold">Para su hogar</h3>
                  <p className="mt-1 text-[0.95rem] text-tinta-suave">El mercado de la semana, en la puerta de su casa.</p>
                </div>
                <div className="rounded-2xl border-2 border-linea bg-white p-5">
                  <Store className="text-bosque" aria-hidden />
                  <h3 className="mt-3 text-lg font-extrabold">Para su negocio</h3>
                  <p className="mt-1 text-[0.95rem] text-tinta-suave">Restaurantes, sodas, hoteles e instituciones, con precios para comercio.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section className="mx-auto max-w-7xl px-4 py-16 md:py-24">
          <h2 className="text-3xl font-black text-bosque md:text-[2.6rem]">Pedir es así de fácil</h2>
          <ol className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              ["Cree su cuenta", "Ingrese con su correo, complete sus datos de entrega y el código de quien le recomendó ProFresco."],
              ["Arme su pedido", "Vea los productos y precios de la semana, elija cantidades y la fecha de entrega."],
              ["Recíbalo fresco", "Llevamos su pedido a la dirección registrada. Puede repetirlo cuando quiera desde su historial."],
            ].map(([t, d], k) => (
              <li key={t} className="relative pl-16">
                <span className="absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full border-[3px] border-hoja text-xl font-black text-bosque">
                  {k + 1}
                </span>
                <h3 className="text-xl font-extrabold">{t}</h3>
                <p className="mt-1 text-tinta-suave">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Llamado final */}
        <section className="px-4 pb-16 md:pb-24">
          <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 overflow-hidden rounded-[36px] bg-bosque px-7 py-12 text-white md:flex-row md:items-center md:justify-between md:px-14">
            <div>
              <h2 className="text-3xl font-black md:text-4xl">¿Listo para su primer pedido?</h2>
              <p className="mt-2 max-w-[48ch] text-lg text-white/85">Regístrese en dos minutos. Si tiene dudas, escríbanos por WhatsApp.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/ingresar" className="btn btn-accion px-6 py-3 text-lg">Crear mi cuenta</Link>
              <a href={whatsappLink("Hola ProFresco, quiero información para hacer un pedido.")} className="btn btn-claro px-6 py-3 text-lg">
                <MessageCircle size={20} aria-hidden /> WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
