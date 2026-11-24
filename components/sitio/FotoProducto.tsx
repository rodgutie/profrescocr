"use client";
import { useState } from "react";
import { alternativaDrive, emojiDe } from "@/lib/images";

/** Foto del producto con respaldo: si la imagen falla o no existe, muestra un ícono. */
export function FotoProducto({
  src,
  nombre,
  categoria,
  className = "",
  tamIcono = "text-[3.2rem]",
}: {
  src: string;
  nombre: string;
  categoria?: string;
  className?: string;
  tamIcono?: string;
}) {
  const [url, setUrl] = useState(src);
  const [fallo, setFallo] = useState(!src);

  if (fallo || !url) {
    return (
      <div className={`flex items-center justify-center bg-campo ${className}`} aria-hidden>
        <span className={`${tamIcono} leading-none`}>{emojiDe(nombre, categoria)}</span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={nombre}
      loading="lazy"
      className={`object-cover ${className}`}
      onError={() => {
        const alt = alternativaDrive(url);
        if (alt && alt !== url) setUrl(alt);
        else setFallo(true);
      }}
    />
  );
}
