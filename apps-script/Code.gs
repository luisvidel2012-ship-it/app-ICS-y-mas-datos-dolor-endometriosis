// Recibe los registros de la app y los agrega a una hoja de Google Sheets.
// INSTALACIÓN: ver README. Cambie TOKEN y pegue el mismo valor en src/config.js.
const TOKEN = "CAMBIAR-ESTA-CLAVE";
const SHEET = "Respuestas";

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.token !== TOKEN) return out({ ok: false, error: "token" });
    const rec = body.record || {};
    const lock = LockService.getScriptLock(); lock.waitLock(10000);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(SHEET) || ss.insertSheet(SHEET);
    const keys = Object.keys(rec);
    if (sh.getLastRow() === 0) sh.appendRow(keys);
    const header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    // evita duplicados si el celular reenvía el mismo registro
    const uids = header.indexOf("uid") >= 0 && sh.getLastRow() > 1
      ? sh.getRange(2, header.indexOf("uid") + 1, sh.getLastRow() - 1, 1).getValues().flat() : [];
    if (uids.indexOf(rec.uid) === -1) sh.appendRow(header.map(h => rec[h] === undefined ? "" : rec[h]));
    lock.releaseLock();
    return out({ ok: true });
  } catch (err) { return out({ ok: false, error: String(err) }); }
}
function out(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
