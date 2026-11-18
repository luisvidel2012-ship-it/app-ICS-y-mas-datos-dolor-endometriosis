# App CSI — Inventario de Sensibilización Central
Aplicación desarrollada por **Karina Castillo**. Instrumento: CSI (Mayer et al., 2012); versión en español: Cuesta-Vargas et al., 2016 (doi:10.1186/s40064-016-3515-4).

**Estado:** piloto con datos ficticios. Los ítems y la Parte B usan el texto oficial del Apéndice de Cuesta-Vargas et al. 2016 (CC BY 4.0). Los rangos de gravedad (30–39, 40–49…) provienen de Neblett et al. 2016 y están pendientes de verificar contra esa fuente; el punto de corte 40 sí figura en el artículo.

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

## Consentimiento informado
Texto en `src/consent.js` (versión `v0.3-2026-11`), enfocado en el uso clínico: orientar la evaluación y el tratamiento. Se adapta solo: sin `SHEETS_URL` dice que los datos quedan en el dispositivo; con `SHEETS_URL` dice que se envían al equipo de salud vía Google y aparece una tercera casilla. Responsable y contacto se definen en `src/config.js`. Se guarda versión y fecha/hora del consentimiento en cada registro.

## Costo mínimo: US$0
- **Hosting:** GitHub Pages (gratis, repositorio público). **Dominio:** el de github.io (gratis). **QR:** `qr/qr-produccion.png` (sin costo).
- **Modo local (el más simple):** dejar `SHEETS_URL` vacío en `src/config.js`. El paciente obtiene su informe en su dispositivo; no se envía nada, no se necesita cuenta de Google.
- **Modo con recolección:** agregar Google Sheets + Apps Script (también gratis; ver arriba). Solo para pruebas o datos ficticios.
- Instalable desde el navegador (Agregar a pantalla de inicio), funciona sin internet.

## Identidad visual
Colores, logo y tipografía de la Dra. Karina Castillo · Ginecología, medidos sobre su pieza gráfica: ciruela `#381048`, rosa `#d23c72`, rosa profundo `#ae2a60`, vino `#980848`, fondo `#fce4ec → #facedf`, botón con degradado `#5a1c5c → #e2508a`. Logo en `icons/logo-kc.png` (recortado de la pieza; reemplazar por el archivo original si se dispone de él). Fuentes incluidas en `fonts/` (DM Serif Display y Nunito Sans, licencia SIL OFL 1.1), sin conexión a servicios externos.

## Informe en PDF
Al terminar, el botón **Descargar mi informe (PDF)** genera en el dispositivo un PDF A4 con: datos del paciente (código, fecha, edad, dolor pélvico, endometriosis), puntaje total, las 25 respuestas, la Parte B completa, observaciones y el consentimiento aceptado (versión y fecha/hora). Usa jsPDF y jspdf-autotable (MIT, en `vendor/`) y las fuentes de la marca incrustadas; se carga solo al pedir el PDF y funciona sin internet. "Ver en pantalla" muestra el mismo contenido para imprimir.

## Interpretación y "Agendar evaluación"
El resultado, el PDF y la vista en pantalla muestran: termómetro con los 5 niveles (Neblett et al., Pain Pract 2017, doi:10.1111/papr.12440; nombres amables para la paciente), texto según el nivel, qué es la sensibilización central, síntomas respondidos con 3–4 agrupados de forma descriptiva (el ítem 24 se excluye) y "Qué puede hacer ahora". El botón **Agendar evaluación** abre WhatsApp con un mensaje de texto listo (número y texto en `src/config.js`); no adjunta ni envía respuestas.
