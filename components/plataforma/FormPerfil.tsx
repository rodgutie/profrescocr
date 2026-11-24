"use client";
import { useState } from "react";
import { Home, Store, Check, X } from "lucide-react";
import { useAuth } from "@/components/plataforma/AuthProvider";
import { guardarPerfil, validarPromotor, type DatosPerfil } from "@/lib/datos";
import { PROVINCIAS } from "@/lib/format";
import type { Perfil, TipoCliente } from "@/lib/types";

export function FormPerfil({ inicial, modo, alGuardar }: { inicial: Perfil | null; modo: "registro" | "editar"; alGuardar: (p: Perfil) => void }) {
  const { sesion, setPerfil } = useAuth();
  const [d, setD] = useState<DatosPerfil>({
    nombre: inicial?.nombre || "",
    telefono: inicial?.telefono || "",
    tipo_cliente: (inicial?.tipo_cliente || "") as TipoCliente,
    empresa: inicial?.empresa || "",
    cedula: inicial?.cedula || "",
    provincia: inicial?.provincia || "San José",
    canton: inicial?.canton || "",
    direccion: inicial?.direccion || "",
    ubicacion_url: inicial?.ubicacion_url || "",
    codigo_promotor: inicial?.codigo_promotor || "",
  });
  const [codigoOk, setCodigoOk] = useState<boolean | null>(inicial ? true : null);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const cambiar = <K extends keyof DatosPerfil>(k: K, v: DatosPerfil[K]) => setD((x) => ({ ...x, [k]: v }));

  async function revisarCodigo() {
    if (modo !== "registro" || !d.codigo_promotor.trim()) return setCodigoOk(null);
    try {
      setCodigoOk(await validarPromotor(d.codigo_promotor));
    } catch {
      setCodigoOk(null);
    }
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!sesion) return;
    if (!d.tipo_cliente) return setError("Indique si es cliente residencial o comercial.");
    if (d.tipo_cliente === "comercial" && !d.empresa?.trim()) return setError("Escriba el nombre del negocio o institución.");
    if (!/^[\d\s+()-]{8,}$/.test(d.telefono.trim())) return setError("Escriba un teléfono válido, por ejemplo 8888-8888.");
    if (modo === "registro" && !d.codigo_promotor.trim()) return setError("El código de promotor es obligatorio.");
    setOcupado(true);
    try {
      const p = await guardarPerfil(sesion, { ...d, codigo_promotor: d.codigo_promotor.trim().toUpperCase() });
      setPerfil(p);
      alGuardar(p);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setOcupado(false);
    }
  }

  const tipoBtn = (valor: TipoCliente, Icono: typeof Home, titulo: string, texto: string) => {
    const activo = d.tipo_cliente === valor;
    return (
      <button
        type="button"
        onClick={() => cambiar("tipo_cliente", valor)}
        aria-pressed={activo}
        disabled={modo === "editar" && !activo}
        className={`flex items-start gap-3 rounded-2xl border-[3px] p-4 text-left transition-colors disabled:opacity-40 ${activo ? "border-bosque bg-campo" : "border-linea enabled:hover:border-hoja"}`}
      >
        <Icono className={activo ? "text-bosque" : "text-tinta-suave"} aria-hidden />
        <span>
          <span className="block font-extrabold">{titulo}</span>
          <span className="block text-sm text-tinta-suave">{texto}</span>
        </span>
      </button>
    );
  };

  return (
    <form onSubmit={enviar} className="space-y-6" noValidate>
      <fieldset>
        <legend className="etiqueta">Tipo de cliente *</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {tipoBtn("residencial", Home, "Residencial", "Compras para mi casa")}
          {tipoBtn("comercial", Store, "Institucional / Comercial", "Restaurante, soda, hotel, institución")}
        </div>
        {modo === "editar" && <p className="ayuda">Para cambiar el tipo de cliente, escríbanos por WhatsApp.</p>}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="etiqueta" htmlFor="nombre">Nombre completo *</label>
          <input id="nombre" className="campo" autoComplete="name" required value={d.nombre} onChange={(e) => cambiar("nombre", e.target.value)} />
        </div>
        <div>
          <label className="etiqueta" htmlFor="telefono">Teléfono / WhatsApp *</label>
          <input id="telefono" className="campo" type="tel" autoComplete="tel" placeholder="8888-8888" required value={d.telefono} onChange={(e) => cambiar("telefono", e.target.value)} />
        </div>
        {d.tipo_cliente === "comercial" && (
          <>
            <div>
              <label className="etiqueta" htmlFor="empresa">Nombre del negocio *</label>
              <input id="empresa" className="campo" autoComplete="organization" value={d.empresa || ""} onChange={(e) => cambiar("empresa", e.target.value)} />
            </div>
            <div>
              <label className="etiqueta" htmlFor="cedula">Cédula jurídica o física</label>
              <input id="cedula" className="campo" value={d.cedula || ""} onChange={(e) => cambiar("cedula", e.target.value)} />
              <p className="ayuda">Para la factura electrónica.</p>
            </div>
          </>
        )}
      </div>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-2 text-lg font-extrabold text-bosque">Dirección de entrega</legend>
        <div>
          <label className="etiqueta" htmlFor="provincia">Provincia *</label>
          <select id="provincia" className="campo" value={d.provincia} onChange={(e) => cambiar("provincia", e.target.value)}>
            {PROVINCIAS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="etiqueta" htmlFor="canton">Cantón y distrito *</label>
          <input id="canton" className="campo" placeholder="Montes de Oca, San Pedro" required value={d.canton} onChange={(e) => cambiar("canton", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="etiqueta" htmlFor="direccion">Dirección exacta *</label>
          <textarea id="direccion" className="campo min-h-24" placeholder="Del Más x Menos 200 m norte, casa verde de portón negro" required value={d.direccion} onChange={(e) => cambiar("direccion", e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className="etiqueta" htmlFor="ubicacion">Enlace de Waze o Google Maps</label>
          <input id="ubicacion" className="campo" type="url" placeholder="https://waze.com/ul/..." value={d.ubicacion_url || ""} onChange={(e) => cambiar("ubicacion_url", e.target.value)} />
          <p className="ayuda">Opcional, pero nos ayuda a llegar más rápido.</p>
        </div>
      </fieldset>

      <div>
        <label className="etiqueta" htmlFor="promotor">Código de promotor *</label>
        {modo === "registro" ? (
          <>
            <div className="relative max-w-xs">
              <input
                id="promotor"
                className="campo pr-10 font-extrabold uppercase tracking-wider"
                required
                value={d.codigo_promotor}
                onChange={(e) => {
                  cambiar("codigo_promotor", e.target.value.toUpperCase());
                  setCodigoOk(null);
                }}
                onBlur={revisarCodigo}
                aria-describedby="promotor-ayuda"
              />
              {codigoOk === true && <Check className="absolute right-3 top-1/2 -translate-y-1/2 text-hoja" aria-label="Código válido" />}
              {codigoOk === false && <X className="absolute right-3 top-1/2 -translate-y-1/2 text-red-700" aria-label="Código no encontrado" />}
            </div>
            <p id="promotor-ayuda" className="ayuda">
              {codigoOk === false ? <span className="font-semibold text-red-700">No encontramos ese código. Revíselo con la persona que le recomendó ProFresco.</span> : "Se lo da la persona que le recomendó ProFresco."}
            </p>
          </>
        ) : (
          <p className="font-extrabold tracking-wider">{d.codigo_promotor} <span className="ml-2 text-sm font-semibold tracking-normal text-tinta-suave">Para cambiarlo, escríbanos.</span></p>
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 p-3 font-semibold text-red-800" role="alert">{error}</p>}
      <button className="btn btn-primary w-full py-3 text-lg sm:w-auto" disabled={ocupado}>
        {ocupado ? "Guardando…" : modo === "registro" ? "Crear mi cuenta" : "Guardar cambios"}
      </button>
    </form>
  );
}
