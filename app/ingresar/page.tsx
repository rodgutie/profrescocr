"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { AvisoDemo } from "@/components/plataforma/AvisoDemo";
import { enviarCodigo, verificarCodigo } from "@/lib/datos";
import { IS_DEMO } from "@/lib/config";

export default function Ingresar() {
  const router = useRouter();
  const { cargando, sesion, perfil, admin } = useAuth();
  const [paso, setPaso] = useState<"correo" | "codigo">("correo");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (cargando || !sesion) return;
    if (perfil) router.replace("/tienda");
    else if (admin) router.replace("/admin");
    else router.replace("/registro");
  }, [cargando, sesion, perfil, admin, router]);

  async function pedirCodigo(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const limpio = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(limpio)) return setError("Escriba un correo válido, por ejemplo nombre@gmail.com.");
    setOcupado(true);
    try {
      await enviarCodigo(limpio);
      setEmail(limpio);
      setPaso("codigo");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOcupado(true);
    try {
      await verificarCodigo(email, codigo);
    } catch (err) {
      setError((err as Error).message);
      setOcupado(false);
    }
  }

  return (
    <main className="grid min-h-screen md:grid-cols-2">
      <div className="relative hidden md:block">
        <img src="/img/verduras-mix.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-bosque-900/90 via-bosque-900/30 to-transparent" />
        <p className="absolute bottom-12 left-12 right-12 max-w-[20ch] text-4xl font-black leading-tight text-white">
          Directo del campo, siempre frescos
        </p>
      </div>
      <div className="flex flex-col px-6 py-8 md:px-14">
        <Link href="/" className="inline-flex items-center gap-2 self-start font-bold text-bosque">
          <ArrowLeft size={18} aria-hidden /> Volver al inicio
        </Link>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10">
          <img src="/brand/logo-color.svg" alt="ProFresco" className="h-12 w-auto self-start" />
          {paso === "correo" ? (
            <form onSubmit={pedirCodigo} className="mt-8">
              <h1 className="text-3xl font-black text-bosque">Ingrese con su correo</h1>
              <p className="mt-2 text-tinta-suave">Le enviamos un código para entrar. Sin contraseñas. Si es su primera vez, creamos su cuenta.</p>
              <label htmlFor="email" className="etiqueta mt-7">Correo electrónico</label>
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                className="campo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nombre@correo.com"
                autoFocus
              />
              {error && <p className="mt-3 font-semibold text-red-700" role="alert">{error}</p>}
              <button className="btn btn-primary mt-5 w-full py-3 text-lg" disabled={ocupado}>
                <Mail size={18} aria-hidden /> {ocupado ? "Enviando…" : "Enviarme el código"}
              </button>
            </form>
          ) : (
            <form onSubmit={entrar} className="mt-8">
              <h1 className="text-3xl font-black text-bosque">Revise su correo</h1>
              <p className="mt-2 text-tinta-suave">
                {IS_DEMO ? "En el modo demo no se envían correos." : <>Enviamos un código a <strong className="text-tinta">{email}</strong>. Puede tardar un minuto; revise también la carpeta de spam.</>}
              </p>
              <label htmlFor="codigo" className="etiqueta mt-7">Código</label>
              <input
                id="codigo"
                inputMode="numeric"
                autoComplete="one-time-code"
                className="campo text-center text-2xl font-black tracking-[0.4em]"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 10))}
                placeholder="••••••"
                autoFocus
              />
              {error && <p className="mt-3 font-semibold text-red-700" role="alert">{error}</p>}
              <button className="btn btn-primary mt-5 w-full py-3 text-lg" disabled={ocupado || codigo.length < 6}>
                {ocupado ? "Verificando…" : "Entrar"}
              </button>
              <button
                type="button"
                className="mt-4 w-full text-center font-bold text-bosque underline underline-offset-4"
                onClick={() => {
                  setPaso("correo");
                  setCodigo("");
                  setError("");
                }}
              >
                Usar otro correo o pedir un código nuevo
              </button>
            </form>
          )}
          <div className="mt-8">
            <AvisoDemo completo />
          </div>
        </div>
      </div>
    </main>
  );
}
