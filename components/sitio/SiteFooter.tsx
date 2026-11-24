import Link from "next/link";
import { whatsappLink, WHATSAPP_VISIBLE } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="bg-bosque-900 text-white/85">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <img src="/brand/logo-blanco.svg" alt="ProFresco" className="h-11 w-auto" />
          <p className="mt-4 max-w-[38ch]">Directo del campo, siempre frescos. Frutas, verduras, huevos y quesos a domicilio en Costa Rica.</p>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white">Contacto</h2>
          <ul className="mt-3 space-y-2">
            <li>
              <a className="hover:text-brote" href={whatsappLink()}>
                WhatsApp {WHATSAPP_VISIBLE}
              </a>
            </li>
            <li>Entregas de lunes a sábado</li>
          </ul>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white">ProFresco</h2>
          <ul className="mt-3 space-y-2">
            <li><Link className="hover:text-brote" href="/quienes-somos">Quiénes somos</Link></li>
            <li><Link className="hover:text-brote" href="/#servicios">Servicios</Link></li>
            <li><Link className="hover:text-brote" href="/ingresar">Ingresar / Registrarse</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-sm text-white/60">© {new Date().getFullYear()} ProFresco. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
