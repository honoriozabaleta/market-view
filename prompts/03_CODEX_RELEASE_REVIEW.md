# Market View — Prompt 3: revisión después del diseño

Revisá los cambios visuales de Claude sobre la base de ingeniería de Market View. Inspeccioná el diff real y la documentación del repo; no te bases en el resumen del otro agente como prueba de que funciona.

Tu objetivo es proteger el producto y corregir regresiones, no rediseñar la interfaz ni deshacer preferencias visuales por gusto personal.

1. Verificá que esquemas, selectores, normalización, comparabilidad, revisión humana y lógica temporal mantengan su significado.
2. Confirmá que todas las cifras y posiciones mostradas provengan de datos y selectores; buscá contenido financiero hardcodeado o inferido en componentes.
3. Construí la salida publicada y comprobá que ningún fixture, borrador, documento original ni secreto se haya empaquetado. El ocultamiento visual no alcanza.
4. Verificá fechas, estados faltantes, stale, quarter-to-date, archivo reconstruido, correcciones e identificadores de evidencia.
5. Probá el recorrido comparador → detalle → fuente, filtros, vuelta atrás y enlaces directos, también bajo /market-view/.
6. Ejecutá instalación reproducible, validación de datos, typecheck, lint, unit tests, browser tests y builds pertinentes. Reportá comandos, resultados y fallas de entorno sin disimularlas.
7. Revisá desktop, tablet y móvil, teclado, foco y accesibilidad básica. Usá los navegadores disponibles; distinguí emulación de una prueba en dispositivo físico.
8. Corregí regresiones verificables con el menor cambio posible y agregá tests donde falten. No reduzcas los tests para que pase el código ni elimines controles editoriales.
9. Confirmá que CI y el deploy manual tengan permisos mínimos y que el artefacto publicado sea exclusivamente la salida validada, no todo el repositorio.

Cerrá con un veredicto: ready for owner review o blocked, evidencia de comprobaciones, problemas pendientes y riesgos concretos. Una revisión técnica no aprueba el uso de fuentes ni certifica asesoramiento financiero.

No publiques automáticamente, no hagas merge a main y no habilites nuevos servicios pagos. Dejá el resultado revisable por el propietario.
