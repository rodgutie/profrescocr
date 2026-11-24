import type { Metadata, Viewport } from "next";
import "@fontsource/nunito/400.css";
import "@fontsource/nunito/600.css";
import "@fontsource/nunito/700.css";
import "@fontsource/nunito/800.css";
import "@fontsource/nunito/900.css";
import "./globals.css";
import { AuthProvider } from "@/components/plataforma/AuthProvider";

const sitio =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(sitio),
  title: {
    default: "ProFresco | Directo del campo, siempre frescos",
    template: "%s | ProFresco",
  },
  description:
    "Frutas, verduras, huevos y quesos frescos a domicilio en Costa Rica. Le llevamos lo que pidió, siempre fresco y a tiempo. Hogares, restaurantes, sodas e instituciones.",
  openGraph: {
    title: "ProFresco | Directo del campo, siempre frescos",
    description: "Le llevamos lo que pidió, siempre fresco y a tiempo.",
    locale: "es_CR",
    type: "website",
    images: ["/img/verduras-mix.jpg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#1f5a1d",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CR">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
