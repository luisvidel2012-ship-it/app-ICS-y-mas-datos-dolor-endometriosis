# App CSI — Inventario de Sensibilización Central

App web (sin servidor, funciona offline) para recolectar el CSI (25 ítems, 0–100, Parte B de diagnósticos) más datos básicos de dolor pélvico/endometriosis.

- Uso: abrir `index.html` o servir con `python3 -m http.server` y abrir en el navegador.
- Datos en `localStorage`; exporta CSV (una fila por registro) y respaldo JSON.
- Niveles: 0–29 subclínico, 30–39 leve, 40–49 moderado, 50–59 grave, 60–100 extremo (corte ≥40).
- Test de puntuación: `node test.js`
