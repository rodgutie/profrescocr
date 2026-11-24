"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Lock } from "lucide-react";
import { FotoProducto } from "@/components/sitio/FotoProducto";
import type { Producto } from "@/lib/types";

const MAX = 12;

export function CatalogoPublico({ productos }: { productos: Producto[] }) {
  const [cat, setCat] = useState<string | null>(null);

  const categorias = useMemo(() => {
    const m = new Map<string, { nombre: string; cantidad: number; foto: Producto | null }>();
    for (const p of productos) {
      const c = m.get(p.categoria) || { nombre: p.categoria, cantidad: 0, foto: null };
      c.cantidad++;
      if (!c.foto && p.imagen) c.foto = p;
      m.set(p.categoria, c);
    }
    return [...m.values()];
  }, [productos]);

  const visibles = useMemo(() => {
    const lista = cat ? productos.filter((p) => p.categoria === cat) : [...productos].sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return lista.slice(0, MAX);
  }, [productos, cat]);

  const total = cat ? productos.filter((p) => p.categoria === cat).length : productos.length;

  if (!productos.length) {
    return <p className="rounded-2xl bg-campo p-8 text-center text-tinta-suave">Estamos actualizando el catálogo. Vuelva en unos minutos.</p>;
  }

  return (
    <div>
      {/* Categorías */}
      <div className="carril -mx-4 auto-cols-[9.5rem] gap-4 px-4 pb-2 md:auto-cols-[11rem]" role="list">
        {categorias.map((c) => {
          const activa = cat === c.nombre;
          return (
            <button
              key={c.nombre}
              role="listitem"
              onClick={() => setCat(activa ? null : c.nombre)}
              aria-pressed={activa}
              className="group text-left"
            >
              <div
                className={`aspect-square overflow-hidden rounded-[28px] border-[3px] bg-white transition-colors ${activa ? "border-barro" : "border-linea group-hover:border-hoja"}`}
              >
                <FotoProducto
                  src={c.foto?.imagen || ""}
                  nombre={c.foto?.nombre || c.nombre}
                  categoria={c.nombre}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <p className="mt-2 font-extrabold leading-tight">{c.nombre}</p>
              <p className="text-sm text-tinta-suave">{c.cantidad} productos</p>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex flex-wrap items-end justify-between gap-3">
        <h3 className="text-2xl font-black text-bosque">{cat || "Destacados de la semana"}</h3>
        <p className="flex items-center gap-1.5 text-sm font-semibold text-tinta-suave">
          <Lock size={14} aria-hidden /> Los precios se ven al ingresar con su cuenta.
        </p>
      </div>

      <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {visibles.map((p) => (
          <li key={p.id}>
            <div className="aspect-square overflow-hidden rounded-2xl border border-linea bg-white">
              <FotoProducto src={p.imagen} nombre={p.nombre} categoria={p.categoria} className="h-full w-full" />
            </div>
            <p className="mt-2 font-extrabold leading-snug">{p.nombre}</p>
            <p className="text-sm text-tinta-suave">Por {p.unidad}</p>
          </li>
        ))}
      </ul>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <Link href="/ingresar" className="btn btn-primary">
          Ver los {total} productos y precios
        </Link>
        {cat && (
          <button className="font-bold text-bosque underline underline-offset-4" onClick={() => setCat(null)}>
            Ver todas las categorías
          </button>
        )}
      </div>
    </div>
  );
}
