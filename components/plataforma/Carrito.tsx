"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/plataforma/AuthProvider";

type Items = Record<string, number>;
interface Carrito {
  items: Items;
  cantidad: (id: string) => number;
  poner: (id: string, cantidad: number) => void;
  reemplazar: (items: Items) => void;
  vaciar: () => void;
  totalLineas: number;
}

const Ctx = createContext<Carrito | null>(null);

export function CarritoProvider({ children }: { children: React.ReactNode }) {
  const { sesion } = useAuth();
  const clave = sesion ? `profresco_carrito_${sesion.userId}` : null;
  const [items, setItems] = useState<Items>({});
  const [cargado, setCargado] = useState<string | null>(null);

  useEffect(() => {
    if (!clave) return;
    try {
      setItems(JSON.parse(localStorage.getItem(clave) || "{}"));
    } catch {
      setItems({});
    }
    setCargado(clave);
  }, [clave]);

  useEffect(() => {
    if (clave && cargado === clave) {
      try {
        localStorage.setItem(clave, JSON.stringify(items));
      } catch {}
    }
  }, [items, clave, cargado]);

  const valor = useMemo<Carrito>(
    () => ({
      items,
      cantidad: (id) => items[id] || 0,
      poner: (id, c) =>
        setItems((x) => {
          const n = { ...x };
          const v = Math.round(c * 100) / 100;
          if (v > 0) n[id] = v;
          else delete n[id];
          return n;
        }),
      reemplazar: (n) => setItems(n),
      vaciar: () => setItems({}),
      totalLineas: Object.keys(items).length,
    }),
    [items],
  );
  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export function useCarrito() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCarrito fuera de CarritoProvider");
  return c;
}

/** Paso de cantidad: medio kilo para productos por peso, 1 para lo demás. */
export function pasoDe(unidad: string) {
  return /^(kg|kilo|kilos|kilogramo)s?$/i.test(unidad.trim()) ? 0.5 : 1;
}
