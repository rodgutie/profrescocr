"use client";
/**
 * Capa de datos del navegador.
 * - Modo real: Supabase (login por correo, perfiles, pedidos, banner).
 * - Modo demo: todo se guarda en localStorage para poder revisar el sitio sin configurar nada.
 */
import { DEMO_ADMIN_EMAILS, DEMO_CODE, IS_DEMO } from "@/lib/config";
import { supabase } from "@/lib/supabase";
import { calcularPedido, fechaEntregaValida } from "@/lib/pedidos";
import { numeroPedido } from "@/lib/format";
import { CLAVE_HERO, CLAVE_HERO_LOCAL, normalizarHero } from "@/lib/hero";
import type { EstadoPedido, HeroSlide, Pedido, Perfil, Producto, Promotor } from "@/lib/types";

export interface Sesion {
  userId: string;
  email: string;
  token?: string;
}

// ── utilidades de modo demo ────────────────────────────────────
const K = { sesion: "profresco_demo_sesion", perfiles: "profresco_demo_perfiles", pedidos: "profresco_demo_pedidos" };

function leerLocal<T>(clave: string, porDefecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    return v ? (JSON.parse(v) as T) : porDefecto;
  } catch {
    return porDefecto;
  }
}
function guardarLocal(clave: string, valor: unknown) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (e) {
    throw new Error("El navegador no permitió guardar los datos de prueba (" + (e as Error).message + ").");
  }
}
const idDemo = (email: string) => "demo-" + Array.from(email).reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7).toString(36);

async function conToken(sesion: Sesion | null): Promise<HeadersInit> {
  if (!sesion) return {};
  if (IS_DEMO) return { "x-profresco-demo": sesion.userId };
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function leerJSON<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || "Algo falló. Intente de nuevo.");
  return data as T;
}

// ── sesión ─────────────────────────────────────────────────────
export async function obtenerSesion(): Promise<Sesion | null> {
  if (IS_DEMO) return leerLocal<Sesion | null>(K.sesion, null);
  const { data } = await supabase().auth.getSession();
  const s = data.session;
  return s ? { userId: s.user.id, email: s.user.email || "", token: s.access_token } : null;
}

export function alCambiarSesion(cb: (s: Sesion | null) => void): () => void {
  if (IS_DEMO) {
    const h = () => cb(leerLocal<Sesion | null>(K.sesion, null));
    window.addEventListener("profresco-sesion", h);
    return () => window.removeEventListener("profresco-sesion", h);
  }
  const { data } = supabase().auth.onAuthStateChange((_e, s) =>
    cb(s ? { userId: s.user.id, email: s.user.email || "", token: s.access_token } : null),
  );
  return () => data.subscription.unsubscribe();
}

export async function enviarCodigo(email: string) {
  if (IS_DEMO) return;
  const { error } = await supabase().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${window.location.origin}/ingresar` },
  });
  if (error) {
    if (/rate|seconds/i.test(error.message)) throw new Error("Ya le enviamos un código hace poco. Espere un minuto y vuelva a intentar.");
    throw new Error("No pudimos enviar el código: " + error.message);
  }
}

export async function verificarCodigo(email: string, codigo: string) {
  if (IS_DEMO) {
    if (codigo.trim() !== DEMO_CODE) throw new Error(`Código incorrecto. En el modo demo el código es ${DEMO_CODE}.`);
    guardarLocal(K.sesion, { userId: idDemo(email), email });
    window.dispatchEvent(new Event("profresco-sesion"));
    return;
  }
  const { error } = await supabase().auth.verifyOtp({ email, token: codigo.trim(), type: "email" });
  if (error) throw new Error("El código no es válido o ya venció. Pida uno nuevo.");
}

export async function cerrarSesion() {
  if (IS_DEMO) {
    localStorage.removeItem(K.sesion);
    window.dispatchEvent(new Event("profresco-sesion"));
    return;
  }
  await supabase().auth.signOut();
}

export async function consultarAdmin(sesion: Sesion | null): Promise<boolean> {
  if (!sesion) return false;
  if (IS_DEMO) return DEMO_ADMIN_EMAILS.includes(sesion.email.toLowerCase());
  const { data } = await supabase().rpc("is_admin");
  return data === true;
}

// ── perfil ─────────────────────────────────────────────────────
export async function leerPerfil(sesion: Sesion): Promise<Perfil | null> {
  if (IS_DEMO) return leerLocal<Record<string, Perfil>>(K.perfiles, {})[sesion.userId] || null;
  const { data } = await supabase().from("perfiles").select("*").eq("id", sesion.userId).maybeSingle();
  return (data as Perfil) || null;
}

export type DatosPerfil = Omit<Perfil, "id" | "email" | "created_at">;

export async function validarPromotor(codigo: string): Promise<boolean> {
  const res = await fetch(`/api/promotores/validar?codigo=${encodeURIComponent(codigo)}`);
  const d = await leerJSON<{ valido: boolean }>(res);
  return d.valido;
}

export async function guardarPerfil(sesion: Sesion, datos: DatosPerfil): Promise<Perfil> {
  if (IS_DEMO) {
    const todos = leerLocal<Record<string, Perfil>>(K.perfiles, {});
    const previo = todos[sesion.userId];
    let codigo = previo?.codigo_promotor;
    if (!codigo) {
      if (!(await validarPromotor(datos.codigo_promotor)))
        throw new Error("El código de promotor no existe. Revíselo con la persona que lo refirió.");
      codigo = datos.codigo_promotor.trim().toUpperCase();
    }
    const perfil: Perfil = {
      ...datos,
      tipo_cliente: previo?.tipo_cliente || datos.tipo_cliente,
      id: sesion.userId,
      email: sesion.email,
      codigo_promotor: codigo,
      created_at: previo?.created_at || new Date().toISOString(),
    };
    todos[sesion.userId] = perfil;
    guardarLocal(K.perfiles, todos);
    return perfil;
  }
  const res = await fetch("/api/perfil", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await conToken(sesion)) },
    body: JSON.stringify(datos),
  });
  return (await leerJSON<{ perfil: Perfil }>(res)).perfil;
}

// ── productos ──────────────────────────────────────────────────
export async function cargarProductos(sesion: Sesion | null): Promise<Producto[]> {
  const res = await fetch("/api/productos", { headers: await conToken(sesion), cache: "no-store" });
  return (await leerJSON<{ productos: Producto[] }>(res)).productos;
}

// ── pedidos ────────────────────────────────────────────────────
export async function crearPedido(
  sesion: Sesion,
  perfil: Perfil,
  datos: { items: { producto_id: string; cantidad: number }[]; fecha_entrega: string; notas: string },
): Promise<Pedido> {
  if (IS_DEMO) {
    if (!fechaEntregaValida(datos.fecha_entrega)) throw new Error("Elija una fecha de entrega de lunes a sábado.");
    const calculo = calcularPedido(await cargarProductos(sesion), perfil.tipo_cliente, datos.items);
    if (calculo.error) throw new Error(calculo.error);
    const todos = leerLocal<Pedido[]>(K.pedidos, []);
    const id = (todos.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
    const pedido: Pedido = {
      id,
      numero: numeroPedido(id),
      user_id: sesion.userId,
      created_at: new Date().toISOString(),
      estado: "nuevo",
      fecha_entrega: datos.fecha_entrega,
      notas: datos.notas.trim() || null,
      tipo_cliente: perfil.tipo_cliente,
      cliente_nombre: perfil.nombre,
      cliente_email: perfil.email,
      cliente_telefono: perfil.telefono,
      cliente_empresa: perfil.empresa,
      direccion_entrega: [perfil.direccion, perfil.canton, perfil.provincia].filter(Boolean).join(", "),
      codigo_promotor: perfil.codigo_promotor,
      items: calculo.lineas,
      total: calculo.total,
    };
    guardarLocal(K.pedidos, [pedido, ...todos]);
    return pedido;
  }
  const res = await fetch("/api/pedidos", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await conToken(sesion)) },
    body: JSON.stringify(datos),
  });
  return (await leerJSON<{ pedido: Pedido }>(res)).pedido;
}

const conNumero = (p: Pedido): Pedido => ({ ...p, total: Number(p.total), numero: numeroPedido(p.id) });

export async function misPedidos(sesion: Sesion): Promise<Pedido[]> {
  if (IS_DEMO) return leerLocal<Pedido[]>(K.pedidos, []).filter((p) => p.user_id === sesion.userId);
  const { data, error } = await supabase()
    .from("pedidos")
    .select("*")
    .eq("user_id", sesion.userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error("No se pudieron cargar sus pedidos.");
  return (data as Pedido[]).map(conNumero);
}

// ── administración ─────────────────────────────────────────────
export async function todosLosPedidos(desde?: string): Promise<Pedido[]> {
  if (IS_DEMO) return leerLocal<Pedido[]>(K.pedidos, []).filter((p) => !desde || p.created_at >= desde);
  let q = supabase().from("pedidos").select("*").order("created_at", { ascending: false }).limit(2000);
  if (desde) q = q.gte("created_at", desde);
  const { data, error } = await q;
  if (error) throw new Error("No se pudieron cargar los pedidos.");
  return (data as Pedido[]).map(conNumero);
}

export async function cambiarEstado(id: number, estado: EstadoPedido) {
  if (IS_DEMO) {
    const todos = leerLocal<Pedido[]>(K.pedidos, []);
    guardarLocal(K.pedidos, todos.map((p) => (p.id === id ? { ...p, estado } : p)));
    return;
  }
  const { error } = await supabase().from("pedidos").update({ estado }).eq("id", id);
  if (error) throw new Error("No se pudo cambiar el estado.");
}

export async function todosLosClientes(): Promise<Perfil[]> {
  if (IS_DEMO)
    return Object.values(leerLocal<Record<string, Perfil>>(K.perfiles, {})).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { data, error } = await supabase().from("perfiles").select("*").order("created_at", { ascending: false }).limit(5000);
  if (error) throw new Error("No se pudieron cargar los clientes.");
  return data as Perfil[];
}

export async function cambiarPromotorDeCliente(cliente: Perfil, codigo: string) {
  const c = codigo.trim().toUpperCase();
  if (!(await validarPromotor(c))) throw new Error("Ese código no está en la lista de promotores activos.");
  if (IS_DEMO) {
    const todos = leerLocal<Record<string, Perfil>>(K.perfiles, {});
    if (todos[cliente.id]) todos[cliente.id].codigo_promotor = c;
    guardarLocal(K.perfiles, todos);
    return;
  }
  const { error } = await supabase().from("perfiles").update({ codigo_promotor: c }).eq("id", cliente.id);
  if (error) throw new Error("No se pudo cambiar el código.");
}

export async function listaPromotores(sesion: Sesion): Promise<Promotor[]> {
  const res = await fetch("/api/promotores", { headers: await conToken(sesion), cache: "no-store" });
  return (await leerJSON<{ promotores: Promotor[] }>(res)).promotores;
}

// ── banner principal ───────────────────────────────────────────
export async function leerHeroLocal(): Promise<HeroSlide[] | null> {
  if (!IS_DEMO) return null;
  const v = leerLocal<HeroSlide[] | null>(CLAVE_HERO_LOCAL, null);
  return v ? normalizarHero(v) : null;
}

export async function leerHeroAdmin(): Promise<HeroSlide[]> {
  if (IS_DEMO) return normalizarHero(leerLocal(CLAVE_HERO_LOCAL, null));
  const { data } = await supabase().from("ajustes").select("valor").eq("clave", CLAVE_HERO).maybeSingle();
  return normalizarHero(data?.valor);
}

export async function guardarHero(slides: HeroSlide[]) {
  if (IS_DEMO) {
    guardarLocal(CLAVE_HERO_LOCAL, slides);
    return;
  }
  const { error } = await supabase()
    .from("ajustes")
    .upsert({ clave: CLAVE_HERO, valor: slides, updated_at: new Date().toISOString() });
  if (error) throw new Error("No se pudo guardar el banner: " + error.message);
}

/** Achica la foto en el navegador antes de subirla (más rápida de cargar). */
async function achicarImagen(file: File, anchoMax: number, calidad: number): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const escala = Math.min(1, anchoMax / bmp.width);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bmp.width * escala);
  canvas.height = Math.round(bmp.height * escala);
  canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return new Promise((ok, mal) => canvas.toBlob((b) => (b ? ok(b) : mal(new Error("No se pudo procesar la imagen"))), "image/jpeg", calidad));
}

export async function subirImagenBanner(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("El archivo debe ser una imagen (JPG, PNG o WebP).");
  if (IS_DEMO) {
    const blob = await achicarImagen(file, 1600, 0.78);
    return new Promise((ok) => {
      const r = new FileReader();
      r.onload = () => ok(String(r.result));
      r.readAsDataURL(blob);
    });
  }
  const blob = await achicarImagen(file, 2400, 0.85);
  const ruta = `banner/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`;
  const { error } = await supabase().storage.from("sitio").upload(ruta, blob, { contentType: "image/jpeg", cacheControl: "31536000" });
  if (error) throw new Error("No se pudo subir la imagen: " + error.message);
  return supabase().storage.from("sitio").getPublicUrl(ruta).data.publicUrl;
}

export async function cambiarTipoDeCliente(cliente: Perfil, tipo: Perfil["tipo_cliente"]) {
  if (IS_DEMO) {
    const todos = leerLocal<Record<string, Perfil>>(K.perfiles, {});
    if (todos[cliente.id]) todos[cliente.id].tipo_cliente = tipo;
    guardarLocal(K.perfiles, todos);
    return;
  }
  const { error } = await supabase().from("perfiles").update({ tipo_cliente: tipo }).eq("id", cliente.id);
  if (error) throw new Error("No se pudo cambiar el tipo de cliente.");
}
