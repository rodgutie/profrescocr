# ProFresco

Sitio y plataforma de pedidos de ProFresco: frutas, verduras, huevos y quesos a domicilio en Costa Rica.

- **Sitio público:** inicio con banner editable, catálogo sin precios, servicios, “Quiénes somos”.
- **Plataforma de clientes** (`/tienda`): ingreso por correo con código, registro con dirección, tipo de cliente y código de promotor, catálogo con precios, carrito, fecha de entrega, historial y “repetir pedido”.
- **Administración** (`/admin`): pedidos, lista de alistado, clientes, promotores y comisiones, editor del banner, exportación CSV.
- **Catálogo y precios** desde Google Sheets.

Stack: Next.js 16 · Tailwind CSS 4 · Supabase · Google Sheets · Vercel.

## Probar en su compu

```bash
npm install
npm run dev
```

Abra http://localhost:3000. Sin variables de entorno corre en **modo demo** (código `123456`, admin `admin@profresco.cr`, promotor `DEMO`).

## Poner en producción

Siga [`docs/GUIA.md`](docs/GUIA.md). Variables en [`.env.example`](.env.example).

## Estructura

```
app/                 páginas y rutas /api
components/sitio     sitio público (header, banner, catálogo)
components/plataforma  login, carrito, perfil, layout de la plataforma
lib/sheets.ts        lectura del Google Sheet (solo servidor)
lib/datos.ts         datos del navegador (Supabase o modo demo)
supabase/schema.sql  tablas y seguridad
docs/                guía, plantillas CSV y Apps Script
```
