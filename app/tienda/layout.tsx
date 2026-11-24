import { CarritoProvider } from "@/components/plataforma/Carrito";

export default function TiendaLayout({ children }: { children: React.ReactNode }) {
  return <CarritoProvider>{children}</CarritoProvider>;
}
