/**
 * ProFresco – copia cada pedido nuevo a Google Sheets.
 *
 * Instalación (5 minutos):
 * 1. Abra el Google Sheet de ProFresco → Extensiones → Apps Script.
 * 2. Borre lo que haya y pegue este archivo completo. Guarde.
 * 3. Cambie SECRETO por una palabra larga cualquiera (la misma va en Vercel como PEDIDOS_WEBHOOK_SECRET).
 * 4. Implementar → Nueva implementación → Tipo: Aplicación web
 *      Ejecutar como: Yo   ·   Quién tiene acceso: Cualquier persona
 * 5. Copie la URL que termina en /exec y péguela en Vercel como PEDIDOS_WEBHOOK_URL.
 *
 * Resultado: una pestaña "Pedidos" con una fila por producto de cada pedido
 * (ideal para tablas dinámicas, compras y contabilidad).
 */
const SECRETO = "cambie-esta-palabra";
const PESTANA = "Pedidos";

const COLUMNAS = [
  "Pedido", "Creado", "Entrega", "Cliente", "Negocio", "Tipo", "Teléfono", "Correo",
  "Dirección", "Promotor", "Producto", "Cantidad", "Unidad", "Precio", "Subtotal", "Total pedido", "Notas",
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const datos = JSON.parse(e.postData.contents);
    if (datos.secreto !== SECRETO) return respuesta({ ok: false, error: "secreto" });
    const p = datos.pedido;

    const libro = SpreadsheetApp.getActiveSpreadsheet();
    let hoja = libro.getSheetByName(PESTANA);
    if (!hoja) {
      hoja = libro.insertSheet(PESTANA);
      hoja.appendRow(COLUMNAS);
      hoja.setFrozenRows(1);
      hoja.getRange(1, 1, 1, COLUMNAS.length).setFontWeight("bold");
    }

    const creado = new Date(p.created_at);
    const filas = p.items.map(function (i) {
      return [
        p.numero, creado, p.fecha_entrega, p.cliente_nombre, p.cliente_empresa || "", p.tipo_cliente,
        p.cliente_telefono, p.cliente_email, p.direccion_entrega, p.codigo_promotor,
        i.nombre, i.cantidad, i.unidad, i.precio, i.subtotal, p.total, p.notas || "",
      ];
    });
    hoja.getRange(hoja.getLastRow() + 1, 1, filas.length, COLUMNAS.length).setValues(filas);
    return respuesta({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function respuesta(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
