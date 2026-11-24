"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { FormPerfil } from "@/components/plataforma/FormPerfil";
import { AvisoDemo } from "@/components/plataforma/AvisoDemo";
import { Cargando } from "@/components/plataforma/PlataformaShell";

export default function Registro() {
  const router = useRouter();
  const { cargando, sesion, perfil, salir } = useAuth();

  useEffect(() => {
    if (cargando) return;
    if (!sesion) router.replace("/ingresar");
    else if (perfil) router.replace("/tienda");
  }, [cargando, sesion, perfil, router]);

  if (cargando || !sesion || perfil) return <Cargando />;

  return (
    <main className="min-h-screen bg-campo px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <img src="/brand/logo-color.svg" alt="ProFresco" className="h-10 w-auto" />
        <div className="mt-6 rounded-[28px] bg-white p-6 md:p-10">
          <h1 className="text-3xl font-black text-bosque">Complete su registro</h1>
          <p className="mt-2 text-tinta-suave">
            Solo la primera vez. Ingresó como <strong className="text-tinta">{sesion.email}</strong>.{" "}
            <button className="font-bold text-bosque underline" onClick={() => salir()}>¿No es usted?</button>
          </p>
          <div className="mt-6"><AvisoDemo completo /></div>
          <div className="mt-8">
            <FormPerfil inicial={null} modo="registro" alGuardar={() => router.replace("/tienda")} />
          </div>
        </div>
      </div>
    </main>
  );
}
