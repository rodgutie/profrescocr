"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { alCambiarSesion, cerrarSesion, consultarAdmin, leerPerfil, obtenerSesion, type Sesion } from "@/lib/datos";
import type { Perfil } from "@/lib/types";

interface Estado {
  cargando: boolean;
  sesion: Sesion | null;
  perfil: Perfil | null;
  admin: boolean;
  setPerfil: (p: Perfil | null) => void;
  salir: () => Promise<void>;
}

const Ctx = createContext<Estado>({
  cargando: true,
  sesion: null,
  perfil: null,
  admin: false,
  setPerfil: () => {},
  salir: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [cargando, setCargando] = useState(true);
  const [sesion, setSesion] = useState<Sesion | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [admin, setAdmin] = useState(false);
  const usuarioActual = useRef<string | null | undefined>(undefined);

  const aplicar = useCallback(async (s: Sesion | null) => {
    usuarioActual.current = s?.userId ?? null;
    setSesion(s);
    if (!s) {
      setPerfil(null);
      setAdmin(false);
      setCargando(false);
      return;
    }
    try {
      const [p, a] = await Promise.all([leerPerfil(s), consultarAdmin(s)]);
      setPerfil(p);
      setAdmin(a);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    let vivo = true;
    obtenerSesion().then((s) => { if (vivo) aplicar(s); }).catch(() => setCargando(false));
    const quitar = alCambiarSesion((s) => {
      // Si solo se refrescó el token, no recarga el perfil.
      if (usuarioActual.current === (s?.userId ?? null)) setSesion(s);
      else aplicar(s);
    });
    return () => {
      vivo = false;
      quitar();
    };
  }, [aplicar]);

  const salir = useCallback(async () => {
    await cerrarSesion();
    await aplicar(null);
  }, [aplicar]);

  return <Ctx.Provider value={{ cargando, sesion, perfil, admin, setPerfil, salir }}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
