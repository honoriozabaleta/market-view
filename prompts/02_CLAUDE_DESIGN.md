# Market View — Prompt 2: diseño e información

Actuá como product designer y frontend engineer de Market View, una plataforma independiente de comparación de perspectivas institucionales orientada a research y asset management.

Vas a trabajar sobre la implementación existente de Codex, en el mismo repositorio. No generes una segunda aplicación, un Artifact desconectado ni una maqueta que reemplace datos reales por números hardcodeados.

## Contexto que debés leer

Inspeccioná el repo. Leé AGENTS.md, CLAUDE.md, README, la metodología y docs/DESIGN_HANDOFF.md. Ejecutá la versión existente y entendé contratos, selectores, componentes y estados antes de editar.

Usá una rama visual basada en la versión integrada de ingeniería. Si no tenés acceso para editar y ejecutar este repositorio, indicá ese límite: no afirmes que lo modificaste.

## Objetivo de diseño

Convertí la base funcional en una herramienta de research con identidad propia, clara y editorial. El usuario debe identificar rápidamente qué opina cada equipo, dónde discrepan, qué cambió, cuán reciente es la evidencia y cómo consultar su fuente.

Priorizá la herramienta sobre la landing. La primera pantalla debe contener información útil y el comparador; evitá un hero enorme que obligue a scrollear para encontrar el producto.

Dirección visual propuesta: light theme, fondo blanco o marfil muy suave, tipografía legible con jerarquía editorial, texto oscuro, acentos azules sobrios, líneas finas y espaciado consistente. Usá cifras tabulares cuando corresponda. No imites una marca existente.

Evitá neón, glassmorphism, gradientes decorativos, tarjetas gigantes, exceso de sombras, animaciones innecesarias y frases publicitarias genéricas. No uses logos de terceros ni tipografías sin derechos verificados; priorizá fuentes del sistema o con licencia documentada.

La interfaz estará en inglés. Explicame tus decisiones en español.

## Experiencia que debés implementar

Overview: fecha de corte visible, cobertura real, filtros comprensibles y matriz central. No llamar «market consensus» a una muestra pequeña. Cuando corresponda, usá «Views in our coverage».

View detail: desde cada celda, un panel accesible con institución y equipo, postura original, clasificación normalizada —solo si existe—, horizonte, benchmark, tesis, riesgos, fechas y evidencia. La diferencia entre fuente e interpretación propia debe ser visible.

Institutions: identidad editorial del equipo y de la publicación, resumen verificable y enlaces a sus observaciones, sin inventar una única house view del grupo.

Quarterly Archive: selector de trimestre, fecha de corte, recorrido histórico y cambios comparables. Diferenciá snapshots contemporáneos, reconstruidos y quarter-to-date. No dibujes continuidad donde faltan observaciones.

Methodology & Sources: lectura sencilla, cobertura y limitaciones accesibles desde los puntos donde afectan la interpretación, no escondidas únicamente en un footer.

Usá divulgación progresiva: comparación rápida primero; justificación y evidencia al abrir el detalle. Conservá los filtros al navegar cuando sea razonable. Cada botón visible debe tener función; lo no implementado se elimina o se identifica honestamente.

## Límites que no debés cruzar

No cambies esquemas, normalizaciones, lógica temporal, umbrales de antigüedad, elegibilidad editorial ni reglas de comparabilidad para que la pantalla quede más llena.

No conviertas not disclosed, not comparable o stale en neutral. No asignes significados financieros nuevos a un color o a un icono. No escondas el aviso persistente de demo.

No inventes cifras, consenso, rentabilidades, citas, fuentes, afiliaciones ni revisiones humanas. Usá los selectores y datos existentes. La producción debe seguir excluyendo fixtures y borradores de sus archivos publicados.

Podés reorganizar y refactorizar componentes de presentación sin alterar esos contratos. Si detectás un problema metodológico, documentalo para el propietario y Codex; no lo resuelvas cambiando silenciosamente la interpretación.

## Responsive y accesibilidad

La tabla debe tener encabezados comprensibles y, cuando ayude, fila/columna fija. En móvil, usá comparación reducida, tarjetas de detalle o scroll contenido con señalización; no achiques toda la tabla hasta hacerla ilegible.

Probá 390, 820 y 1440 píxeles. La experiencia en tablet es importante. No dependas de hover: soporte táctil, teclado, foco visible, etiquetas y devolución del foco al cerrar paneles.

No uses el color como único indicador. Protegé contraste, lectura, estados vacíos y reduced motion. Mostrá fechas e información de calidad también en móvil.

## Proceso y entrega

Presentá una dirección visual breve y luego implementala; no te quedes en recomendaciones. Evitá agregar dependencias pesadas por efectos decorativos.

Ejecutá las pruebas existentes, verificá los recorridos principales y revisá capturas reales de desktop, tablet y móvil. Si alguna herramienta no está disponible, registralo y no inventes una verificación.

Actualizá docs/DESIGN_HANDOFF.md con componentes modificados, tokens, comportamiento responsive y decisiones. Entregá cambios revisables, resultados reales de pruebas y pendientes. No hagas merge, deploy público ni cambios de permisos sin autorización.

El resultado debe ser el mismo producto, con la misma evidencia y metodología, pero con una presentación mucho más clara y profesional.
