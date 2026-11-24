export type TipoCliente = "residencial" | "comercial";

export interface Producto {
  id: string;
  nombre: string;
  categoria: string;
  unidad: string;
  descripcion: string;
  imagen: string;          // URL final lista para <img>
  destacado: boolean;
  orden: number;
  /** Solo viene cuando el usuario inició sesión. */
  precio?: number | null;
  precioResidencial?: number | null;
  precioComercial?: number | null;
}

export interface Promotor {
  codigo: string;
  nombre: string;
  comisionPct: number;
  activo: boolean;
}

export interface Perfil {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  tipo_cliente: TipoCliente;
  empresa: string | null;
  cedula: string | null;
  provincia: string;
  canton: string;
  direccion: string;
  ubicacion_url: string | null;
  codigo_promotor: string;
  created_at: string;
}

export type EstadoPedido = "nuevo" | "confirmado" | "en_ruta" | "entregado" | "cancelado";

export interface LineaPedido {
  producto_id: string;
  nombre: string;
  unidad: string;
  cantidad: number;
  precio: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  numero: string;
  user_id: string;
  created_at: string;
  estado: EstadoPedido;
  fecha_entrega: string;
  notas: string | null;
  tipo_cliente: TipoCliente;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string;
  cliente_empresa: string | null;
  direccion_entrega: string;
  codigo_promotor: string;
  items: LineaPedido[];
  total: number;
}

export interface HeroSlide {
  id: string;
  activo: boolean;
  enEscritorio: boolean;
  enMovil: boolean;
  imagen: string;
  titulo: string;
  subtitulo: string;
  botonTexto: string;
  botonDestino: string;
  alineacion: "izquierda" | "centro" | "derecha";
  colorTexto: "claro" | "oscuro";
  oscurecer: number;     // 0–80 (%)
  ajuste: "cubrir" | "contener";
  zoom: number;          // 50–200 (%)
  posX: number;          // 0–100 (%)
  posY: number;          // 0–100 (%)
  fondo: string;         // color de fondo visible cuando la imagen es más pequeña
}
