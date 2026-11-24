# Guía de puesta en marcha – ProFresco

Esta guía lleva el sitio del **modo demo** al **modo real**. Se hace una sola vez y toma unos 30 minutos.

## Cómo está armado

| Pieza | Para qué | Quién lo edita |
|---|---|---|
| **Google Sheets** (pestañas *Productos* y *Promotores*) | Catálogo, precios semanales, fotos, códigos de promotor y % de comisión | ProFresco, desde el celular o la compu |
| **Supabase** (gratis) | Login por correo, clientes, pedidos, banner | Automático; se consulta desde `/admin` |
| **Vercel** | Publica el sitio | Se actualiza solo con cada `git push` |
| **Apps Script** (opcional) | Copia cada pedido nuevo a una pestaña *Pedidos* del Sheet | Automático |

Mientras Supabase no esté configurado, el sitio corre en **modo demo**: cualquier correo entra con el código `123456`, `admin@profresco.cr` abre el panel, y los datos se guardan solo en el navegador de quien prueba.

---

## 1. Subir a GitHub y Vercel

```bash
cd profresco
git init && git add . && git commit -m "ProFresco MVP"
git branch -M main
git remote add origin https://github.com/SU-USUARIO/profresco.git
git push -u origin main
```

En Vercel: **Add New → Project → Import** el repositorio → **Deploy**. Ya se puede revisar en modo demo.

## 2. Google Sheet del catálogo

1. Cree un Google Sheet con dos pestañas: **Productos** y **Promotores**.
2. Importe las plantillas de `docs/plantillas/` (Archivo → Importar → Subir → *Reemplazar hoja actual*).
3. **Archivo → Compartir → Publicar en la web**: elija la pestaña *Productos*, formato **Valores separados por comas (.csv)** → Publicar. Copie la URL. Repita con *Promotores*.
4. En Vercel → Settings → Environment Variables:
   - `SHEET_PRODUCTOS_CSV_URL` = URL de Productos
   - `SHEET_PROMOTORES_CSV_URL` = URL de Promotores
5. Redeploy (Deployments → ⋯ → Redeploy).

### Columnas de *Productos*

| Columna | Obligatoria | Ejemplo | Notas |
|---|---|---|---|
| `id` | sí | `TOM-01` | Único y **no lo cambie** después: los pedidos lo usan para “Repetir pedido”. |
| `nombre` | sí | Tomate | |
| `categoria` | sí | Verduras | Las categorías salen solas de esta columna. |
| `unidad` | sí | kg, unidad, rollo, cartón 30 | Si dice `kg`, el cliente puede pedir de medio en medio kilo. |
| `precio_residencial` | sí | 1200 | Precio para hogares. |
| `precio_comercial` | no | 1050 | Precio para comercio / instituciones. Si está vacío se usa el residencial. |
| `imagen` | no | (ver abajo) | |
| `activo` | no | SI / NO | `NO` lo oculta sin borrarlo. Vacío = SI. |
| `destacado` | no | SI | Aparece primero en la página de inicio. |
| `descripcion` | no | Tomate de Zarcero | Texto corto bajo el nombre. |
| `orden` | no | 1, 2, 3… | Orden dentro del catálogo. |

**Agregar un producto:** agregue una fila. **Quitar un producto:** ponga `activo = NO` (o borre la fila). **Cambiar precios:** edite la celda.
Los cambios aparecen en el sitio en **unos 5 minutos** (Google tarda un poco en refrescar la versión publicada y el sitio guarda copia 2 minutos).

### Columnas de *Promotores*

`codigo` (lo que escribe el cliente), `nombre`, `comision_pct` (ej. `5`), `activo` (SI/NO).
Un código inactivo ya no sirve para registrarse, pero sus clientes y comisiones se siguen viendo en `/admin/promotores`.

## 3. Fotos de los productos

La columna `imagen` acepta tres cosas. **Recomendado: Google Drive.**

**A. Google Drive (lo más fácil para el equipo)**
1. Cree una carpeta “Fotos ProFresco” en Drive.
2. Compártala como **Cualquier persona con el enlace → Lector**.
3. Suba las fotos (cuadradas o casi cuadradas, mínimo 800 × 800 px, fondo limpio).
4. En cada foto: clic derecho → Compartir → **Copiar vínculo**, y péguelo en la columna `imagen`.
El sitio convierte ese enlace automáticamente en una imagen.

**B. Cualquier URL pública** de una imagen (`https://...jpg`), por ejemplo de Cloudinary.

**C. Nombre de archivo** (`tomate.jpg`) para fotos guardadas en `public/productos/` del proyecto. Sirve para fotos fijas; cada cambio requiere un `git push`.

Si un producto no tiene foto, o la foto falla, se muestra un ícono del producto en lugar de un espacio roto.

> Consejo: mismo fondo, misma luz y mismo encuadre en todas las fotos hacen que el catálogo se vea profesional.
> Las fotos de ejemplo actuales son recortes de una sola imagen; reemplácelas por fotos propias.

## 4. Supabase (login y base de datos)

1. Cree una cuenta en https://supabase.com → **New project** (región: *East US* es la más cercana a Costa Rica).
2. **SQL Editor → New query** → pegue todo `supabase/schema.sql` → **Run**.
3. Agregue los administradores en el SQL Editor:
   ```sql
   insert into public.admins (email) values ('rodgutie@gmail.com') on conflict do nothing;
   ```
4. **Authentication → Sign In / Providers → Email**: deje activo *Email*. Confirm email puede quedar activo.
5. **Authentication → Emails → Templates → Magic Link**: reemplace el contenido para que muestre el código:
   ```html
   <h2>Su código para ingresar a ProFresco</h2>
   <p style="font-size:28px;font-weight:bold;letter-spacing:6px">{{ .Token }}</p>
   <p>O toque este enlace: <a href="{{ .ConfirmationURL }}">Ingresar</a></p>
   ```
   Haga lo mismo en la plantilla **Confirm signup** (es la que reciben los clientes nuevos).
6. **Authentication → URL Configuration**: *Site URL* = la URL de Vercel (o su dominio). Agregue la misma en *Redirect URLs*.
7. **Correo (importante):** el envío de correos incluido en Supabase está limitado a unos pocos por hora y es solo para pruebas. Para producción conecte un SMTP propio en **Authentication → Emails → SMTP Settings**. Resend (resend.com) tiene plan gratis de 3 000 correos/mes y sirve con el dominio `profrescocr.com`.
8. **Project Settings → API**: copie a Vercel
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon / publishable key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role / secret key (**nunca** la comparta ni la ponga en el código)
9. Redeploy. El aviso “Modo demo” desaparece.

## 5. Pedidos también en Google Sheets (opcional)

Siga las instrucciones dentro de `docs/apps-script-pedidos.gs` y agregue en Vercel `PEDIDOS_WEBHOOK_URL` y `PEDIDOS_WEBHOOK_SECRET`.
Cada pedido nuevo agrega filas a la pestaña *Pedidos* (una por producto). Los cambios de estado se manejan en `/admin`.

## 6. Dominio

Vercel → Settings → Domains → agregue `profrescocr.com` y siga las instrucciones de DNS. Luego actualice la *Site URL* en Supabase.

---

## Qué hay en el panel `/admin`

- **Pedidos:** filtros por estado, fecha de entrega y búsqueda; cambio de estado (Recibido → Confirmado → En ruta → Entregado / Cancelado); **lista de alistado** (suma por producto para una fecha de entrega, para compras y empaque); exportar CSV.
- **Clientes:** datos de entrega, teléfono con enlace a WhatsApp, total comprado, cambiar tipo de cliente o código de promotor; exportar CSV.
- **Promotores:** por mes, clientes referidos, pedidos, ventas y comisión estimada (sobre pedidos **entregados**); exportar CSV.
- **Banner:** diapositivas del carrusel de inicio con imagen, título, subtítulo, botón y destino; tamaño y encuadre de la imagen (arrastrando o con controles); mostrar u ocultar en escritorio y en móvil; vista previa de ambos.

## Reglas de negocio incluidas

- Precios solo visibles con sesión iniciada; cada cliente ve únicamente el precio de su tipo (residencial o comercial).
- Los precios del pedido se calculan **en el servidor** con el Sheet vigente, no en el navegador.
- El código de promotor es obligatorio, se valida contra el Sheet y queda fijo; solo un administrador lo cambia. Lo mismo con el tipo de cliente.
- Entregas de lunes a sábado, desde el día siguiente y hasta 30 días adelante.
