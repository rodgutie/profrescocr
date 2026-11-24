import { IS_DEMO, DEMO_CODE, DEMO_ADMIN_EMAILS } from "@/lib/config";

export function AvisoDemo({ completo = false }: { completo?: boolean }) {
  if (!IS_DEMO) return null;
  return (
    <div className="rounded-2xl border-2 border-dashed border-barro/50 bg-[#fff7f0] p-4 text-sm text-tinta">
      <p className="font-extrabold text-barro">Modo demo</p>
      <p className="mt-1">
        Supabase aún no está conectado. Use cualquier correo y el código <strong>{DEMO_CODE}</strong>.
        {completo && (
          <>
            {" "}Para entrar al panel de administración use <strong>{DEMO_ADMIN_EMAILS[0]}</strong>. Código de promotor de prueba:{" "}
            <strong>DEMO</strong>. Los datos se guardan solo en este navegador.
          </>
        )}
      </p>
    </div>
  );
}
