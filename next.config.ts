import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las fotos de productos vienen de Google Drive u otras URLs: usamos <img> normal,
  // así no hay que registrar cada dominio aquí.
  poweredByHeader: false,
};

export default nextConfig;
