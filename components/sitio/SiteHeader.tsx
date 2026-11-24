"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, MessageCircle, UserRound } from "lucide-react";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { whatsappLink, WHATSAPP_VISIBLE } from "@/lib/config";

const NAV = [
  { href: "/#productos", texto: "Productos" },
  { href: "/#servicios", texto: "Servicios" },
  { href: "/quienes-somos", texto: "Quiénes somos" },
];

export function SiteHeader() {
  const [abierto, setAbierto] = useState(false);
  const { sesion, admin } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-linea bg-white/95 backdrop-blur">
      <div className="bg-bosque text-white text-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-1.5">
          <p className="truncate">Entregas a domicilio de lunes a sábado</p>
          <a href={whatsappLink()} className="hidden shrink-0 items-center gap-1.5 font-bold hover:text-brote sm:inline-flex">
            <MessageCircle size={15} aria-hidden /> WhatsApp {WHATSAPP_VISIBLE}
          </a>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="shrink-0" aria-label="ProFresco, ir al inicio">
          <img src="/brand/logo-color.svg" alt="ProFresco" className="h-9 w-auto md:h-11" />
        </Link>
        <nav className="ml-4 hidden items-center gap-7 font-bold text-tinta md:flex" aria-label="Principal">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-bosque hover:underline decoration-hoja decoration-[3px] underline-offset-8">
              {n.texto}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {sesion ? (
            <>
              {admin && (
                <Link href="/admin" className="btn btn-borde btn-sm hidden sm:inline-flex">
                  Administración
                </Link>
              )}
              <Link href="/tienda" className="btn btn-primary btn-sm">
                <UserRound size={16} aria-hidden /> Mi cuenta
              </Link>
            </>
          ) : (
            <>
              <Link href="/ingresar" className="btn btn-borde btn-sm hidden sm:inline-flex">
                Ingresar
              </Link>
              <Link href="/ingresar" className="btn btn-accion btn-sm">
                Hacer pedido
              </Link>
            </>
          )}
          <button
            className="ml-1 rounded-full p-2 text-bosque md:hidden"
            onClick={() => setAbierto((v) => !v)}
            aria-expanded={abierto}
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
          >
            {abierto ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {abierto && (
        <nav className="border-t border-linea bg-white md:hidden" aria-label="Menú móvil">
          <ul className="mx-auto max-w-7xl px-4 py-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} onClick={() => setAbierto(false)} className="block py-3 text-lg font-bold">
                  {n.texto}
                </Link>
              </li>
            ))}
            {!sesion && (
              <li>
                <Link href="/ingresar" onClick={() => setAbierto(false)} className="block py-3 text-lg font-bold">
                  Ingresar
                </Link>
              </li>
            )}
            <li>
              <a href={whatsappLink()} className="flex items-center gap-2 py-3 text-lg font-bold text-bosque">
                <MessageCircle size={18} aria-hidden /> WhatsApp {WHATSAPP_VISIBLE}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
