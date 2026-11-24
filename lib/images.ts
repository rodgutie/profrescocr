/**
 * Convierte lo que venga en la columna "imagen" del Google Sheet en una URL usable:
 *  - Enlace de Google Drive ("Compartir → cualquier persona con el enlace")  → imagen directa
 *  - URL normal (https://...)                                               → se usa tal cual
 *  - Nombre de archivo (tomate.jpg)                                         → /productos/tomate.jpg (carpeta public del proyecto)
 */
export function idDeDrive(valor: string): string | null {
  const v = valor.trim();
  const m =
    v.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]{10,})/) ||
    v.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?(?:.*&)?id=([a-zA-Z0-9_-]{10,})/) ||
    v.match(/docs\.google\.com\/uc\?(?:.*&)?id=([a-zA-Z0-9_-]{10,})/) ||
    v.match(/lh3\.googleusercontent\.com\/d\/([a-zA-Z0-9_-]{10,})/);
  return m ? m[1] : null;
}

export function resolverImagen(valor: string | undefined | null): string {
  const v = (valor || "").trim();
  if (!v) return "";
  const drive = idDeDrive(v);
  if (drive) return `https://lh3.googleusercontent.com/d/${drive}=w800`;
  if (/^https?:\/\//i.test(v) || v.startsWith("/") || v.startsWith("data:")) return v;
  return `/productos/${v}`;
}

/** Segundo intento si la primera URL de Drive falla. */
export function alternativaDrive(url: string): string | null {
  const id = idDeDrive(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w800` : null;
}

const EMOJIS: [RegExp, string][] = [
  [/tomate/i, "🍅"], [/zanahoria/i, "🥕"], [/br[oó]coli|romanesco/i, "🥦"], [/lechuga|repollo|col\b|espinaca|kale/i, "🥬"],
  [/papa|patata/i, "🥔"], [/cebolla/i, "🧅"], [/ajo/i, "🧄"], [/chile|pimiento/i, "🫑"], [/pepino|zucchini|zucchin|ayote/i, "🥒"],
  [/berenjena/i, "🍆"], [/aguacate/i, "🥑"], [/elote|ma[ií]z/i, "🌽"], [/hongo/i, "🍄"], [/manzana/i, "🍎"], [/pera/i, "🍐"],
  [/naranja|mandarina/i, "🍊"], [/lim[oó]n/i, "🍋"], [/banano|banana|pl[aá]tano/i, "🍌"], [/pi[ñn]a/i, "🍍"], [/mango/i, "🥭"],
  [/fresa/i, "🍓"], [/uva/i, "🍇"], [/sand[ií]a/i, "🍉"], [/mel[oó]n/i, "🍈"], [/coco/i, "🥥"], [/kiwi/i, "🥝"],
  [/huevo/i, "🥚"], [/queso/i, "🧀"], [/leche|natilla/i, "🥛"], [/culantro|cilantro|hierba|albahaca|perejil|menta|apio/i, "🌿"],
  [/camote|yuca|tub[eé]rculo/i, "🍠"], [/frijol|grano/i, "🫘"],
];

export function emojiDe(nombre: string, categoria = ""): string {
  for (const [re, e] of EMOJIS) if (re.test(nombre)) return e;
  for (const [re, e] of EMOJIS) if (re.test(categoria)) return e;
  if (/fruta/i.test(categoria)) return "🍎";
  if (/l[aá]cteo|huevo/i.test(categoria)) return "🥚";
  return "🥬";
}
