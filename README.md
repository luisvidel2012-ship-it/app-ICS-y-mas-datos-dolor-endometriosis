# App CSI — Inventario de Sensibilización Central
Aplicación desarrollada por **Karina Castillo**. Instrumento: CSI (Mayer et al., 2012); versión en español: Cuesta-Vargas et al., 2016 (doi:10.1186/s40064-016-3515-4).

**Estado:** piloto con datos ficticios. El texto de los ítems es provisional hasta cargar la versión oficial (ver aviso en `src/csi.js`).

## Probar
`python3 -m http.server 8000` y abrir `http://localhost:8000/?demo=1` (el parámetro `demo=1` marca los registros como ficticios).

## Conectar con Google Sheets
1. Crear una cuenta de Google exclusiva del proyecto (con verificación en 2 pasos) y una hoja nueva.
2. Extensiones → Apps Script: pegar `apps-script/Code.gs` y cambiar `TOKEN`.
3. Implementar → Nueva implementación → Aplicación web → Ejecutar como: yo; Acceso: cualquiera. Copiar la URL `/exec`.
4. Pegar esa URL y el mismo TOKEN en `src/config.js`.

## QR
Publicar la carpeta (GitHub Pages o similar) y ejecutar `pip install segno && python3 make-qr.py URL_PUBLICA CODIGO_CLINICA` → `qr.png` / `qr.svg`. Agregar `--demo` para un QR de pruebas.

## Equipo
`URL#staff` muestra la pestaña de registros locales (copias pendientes de envío y exportación CSV).

## Antes de usar con pacientes reales
Aprobación del comité de ética, consentimiento definitivo, ID anónimo (sin nombre ni RUT) y revisión de la Ley 19.628 y la nueva ley de protección de datos personales (Ley 21.719). No recomendado: Google Sheets personal; usar base de datos con control de acceso.
