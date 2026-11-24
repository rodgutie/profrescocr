"use client";
import { useState } from "react";
import { PlataformaShell } from "@/components/plataforma/PlataformaShell";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { FormPerfil } from "@/components/plataforma/FormPerfil";

function Editar() {
  const { perfil, sesion } = useAuth();
  const [guardado, setGuardado] = useState(false);
  return (
    <div className="mx-auto max-w-2xl rounded-[28px] bg-white p-6 md:p-10">
      <h1 className="text-3xl font-black text-bosque">Mi perfil</h1>
      <p className="mt-1 text-tinta-suave">Correo de ingreso: {sesion?.email}</p>
      {guardado && <p className="mt-4 rounded-xl bg-brote/50 p-3 font-bold text-bosque-900" role="status">Cambios guardados.</p>}
      <div className="mt-6">
        <FormPerfil inicial={perfil} modo="editar" alGuardar={() => setGuardado(true)} />
      </div>
    </div>
  );
}

export default function Perfil() {
  return (
    <PlataformaShell>
      <Editar />
    </PlataformaShell>
  );
}
