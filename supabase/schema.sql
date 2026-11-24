-- ════════════════════════════════════════════════════════════════
-- ProFresco – esquema de base de datos (Supabase / Postgres)
-- Cómo usarlo: Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede correr más de una vez sin romper nada.
-- ════════════════════════════════════════════════════════════════

-- 1) Administradores (correos con acceso al panel /admin)
create table if not exists public.admins (
  email text primary key
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- 2) Perfil de cada cliente (se llena en el primer ingreso)
create table if not exists public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nombre text not null,
  telefono text not null,
  tipo_cliente text not null check (tipo_cliente in ('residencial', 'comercial')),
  empresa text,
  cedula text,
  provincia text not null,
  canton text not null,
  direccion text not null,
  ubicacion_url text,
  codigo_promotor text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3) Pedidos (las líneas del pedido se guardan en "items" como JSON)
create table if not exists public.pedidos (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  estado text not null default 'nuevo'
    check (estado in ('nuevo', 'confirmado', 'en_ruta', 'entregado', 'cancelado')),
  fecha_entrega date not null,
  notas text,
  tipo_cliente text not null,
  cliente_nombre text not null,
  cliente_email text not null,
  cliente_telefono text not null,
  cliente_empresa text,
  direccion_entrega text not null,
  codigo_promotor text not null,
  items jsonb not null,
  total numeric(12, 2) not null
);

create index if not exists pedidos_user_idx on public.pedidos (user_id, created_at desc);
create index if not exists pedidos_promotor_idx on public.pedidos (codigo_promotor);

-- 4) Ajustes del sitio (banner principal, etc.)
create table if not exists public.ajustes (
  clave text primary key,
  valor jsonb not null,
  updated_at timestamptz not null default now()
);

-- ── Seguridad (Row Level Security) ─────────────────────────────
-- Los clientes solo ven lo suyo. Perfiles y pedidos se CREAN desde el servidor
-- (rutas /api), que valida el código de promotor y calcula los precios.
alter table public.admins   enable row level security;
alter table public.perfiles enable row level security;
alter table public.pedidos  enable row level security;
alter table public.ajustes  enable row level security;

drop policy if exists "admins_leer" on public.admins;
create policy "admins_leer" on public.admins for select using (public.is_admin());

drop policy if exists "perfiles_leer" on public.perfiles;
create policy "perfiles_leer" on public.perfiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "perfiles_admin_editar" on public.perfiles;
create policy "perfiles_admin_editar" on public.perfiles for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "pedidos_leer" on public.pedidos;
create policy "pedidos_leer" on public.pedidos for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "pedidos_admin_editar" on public.pedidos;
create policy "pedidos_admin_editar" on public.pedidos for update
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "ajustes_leer" on public.ajustes;
create policy "ajustes_leer" on public.ajustes for select using (true);

drop policy if exists "ajustes_admin_insertar" on public.ajustes;
create policy "ajustes_admin_insertar" on public.ajustes for insert with check (public.is_admin());

drop policy if exists "ajustes_admin_editar" on public.ajustes;
create policy "ajustes_admin_editar" on public.ajustes for update
  using (public.is_admin()) with check (public.is_admin());

-- ── Imágenes del sitio (banner) ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('sitio', 'sitio', true)
on conflict (id) do update set public = true;

drop policy if exists "sitio_admin_subir" on storage.objects;
create policy "sitio_admin_subir" on storage.objects for insert
  with check (bucket_id = 'sitio' and public.is_admin());

drop policy if exists "sitio_admin_editar" on storage.objects;
create policy "sitio_admin_editar" on storage.objects for update
  using (bucket_id = 'sitio' and public.is_admin());

drop policy if exists "sitio_admin_borrar" on storage.objects;
create policy "sitio_admin_borrar" on storage.objects for delete
  using (bucket_id = 'sitio' and public.is_admin());

-- ════════════════════════════════════════════════════════════════
-- 5) Agregue aquí su correo de administrador (y el de quien ocupe):
-- insert into public.admins (email) values ('rodgutie@gmail.com') on conflict do nothing;
-- ════════════════════════════════════════════════════════════════
