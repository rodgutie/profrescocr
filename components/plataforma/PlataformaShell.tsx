"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { IS_DEMO } from "@/lib/config";

export function Cargando() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status">
      <div className="flex flex-col items-center gap-3 text-tinta-suave">
        <img src="/brand/icono.svg" alt="" className="h-14 w-14 animate-pulse" />
        <span className="font-semibold">Cargando…</span>
      </div>
    </div>
  );
}

const NAV_CLIENTE = [
  { href: "/tienda", texto: "Comprar" },
  { href: "/tienda/pedidos", texto: "Mis pedidos" },
  { href: "/tienda/perfil", texto: "Mi perfil" },
];
const NAV_ADMIN = [
  { href: "/admin", texto: "Pedidos" },
  { href: "/admin/clientes", texto: "Clientes" },
  { href: "/admin/promotores", texto: "Promotores" },
  { href: "/admin/banner", texto: "Banner" },
];

export function PlataformaShell({ children, area = "cliente", accion }: { children: React.ReactNode; area?: "cliente" | "admin"; accion?: React.ReactNode }) {
  const router = useRouter();
  const ruta = usePathname();
  const { cargando, sesion, perfil, admin, salir } = useAuth();

  useEffect(() => {
    if (cargando) return;
    if (!sesion) router.replace("/ingresar");
    else if (area === "cliente" && !perfil) router.replace(admin ? "/admin" : "/registro");
  }, [cargando, sesion, perfil, admin, area, router]);

  const listo = !cargando && sesion && (area === "admin" ? admin : perfil);
  const nav = area === "admin" ? NAV_ADMIN : NAV_CLIENTE;

  return (
    <div className="min-h-screen bg-campo">
      <header className={`sticky top-0 z-30 border-b ${area === "admin" ? "border-bosque-900 bg-bosque-900 text-white" : "border-linea bg-white"}`}>
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Link href="/" aria-label="Ir al sitio público" className="shrink-0">
            <img src={area === "admin" ? "/brand/logo-blanco.svg" : "/brand/logo-color.svg"} alt="ProFresco" className="h-8 w-auto md:h-9" />
          </Link>
          {area === "admin" && <span className="hidden rounded-full bg-white/15 px-3 py-1 text-sm font-bold sm:inline">Administración</span>}
          <div className="ml-auto flex items-center gap-2">
            {accion}
            {admin && area === "cliente" && <Link href="/admin" className="btn btn-borde btn-sm hidden md:inline-flex">Administración</Link>}
            {admin && area === "admin" && perfil && <Link href="/tienda" className="btn btn-claro btn-sm hidden md:inline-flex">Ver tienda</Link>}
            <button
              onClick={() => salir().then(() => router.replace("/"))}
              className={`btn btn-sm ${area === "admin" ? "text-white/85 hover:text-white" : "text-tinta-suave hover:text-bosque"}`}
              aria-label="Cerrar sesión"
            >
              <LogOut size={17} aria-hidden /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
        <nav className="mx-auto max-w-7xl px-4" aria-label="Secciones">
          <ul className="carril auto-cols-max gap-1">
            {nav.map((n) => {
              const activo = n.href === ruta;
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={activo ? "page" : undefined}
                    className={`block border-b-[3px] px-3 py-2.5 font-bold ${
                      activo ? (area === "admin" ? "border-brote text-white" : "border-barro text-bosque") : `border-transparent ${area === "admin" ? "text-white/70 hover:text-white" : "text-tinta-suave hover:text-bosque"}`
                    }`}
                  >
                    {n.texto}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>
      {IS_DEMO && (
        <p className="bg-[#fff1e4] px-4 py-1.5 text-center text-sm font-semibold text-barro-700">
          Modo demo: los datos se guardan solo en este navegador.
        </p>
      )}
      <main className="mx-auto max-w-7xl px-4 py-6 md:py-8">
        {cargando || !sesion ? (
          <Cargando />
        ) : area === "admin" && !admin ? (
          <div className="mx-auto max-w-md rounded-3xl bg-white p-8 text-center">
            <h1 className="text-2xl font-black text-bosque">Esta sección es solo para administradores</h1>
            <p className="mt-2 text-tinta-suave">Ingresó como {sesion.email}. Si debería tener acceso, pida que agreguen su correo a la lista de administradores.</p>
            <Link href="/tienda" className="btn btn-primary mt-6">Ir a la tienda</Link>
          </div>
        ) : listo ? (
          children
        ) : (
          <Cargando />
        )}
      </main>
    </div>
  );
}
