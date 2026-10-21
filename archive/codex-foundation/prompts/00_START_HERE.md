# Market View — Paquete de arranque

Preparado el 19 de octubre de 2026.

Este paquete contiene prompts de trabajo. No es una aplicación implementada y no crea ni modifica por sí solo un repositorio.

## Orden de uso

1. Abrí o creá tu repositorio `market-view` y poné el contenido de este paquete en `prompts/`. Elegí personalmente su visibilidad. No agregues documentos de terceros, secretos ni información del empleador.
2. Con Codex trabajando sobre ese repo, enviá: «Leé prompts/01_CODEX_FOUNDATION.md e implementá esa primera entrega. Inspeccioná antes cualquier código existente y preservá el trabajo previo». También podés pegar el prompt completo sin subir este paquete.
3. Ejecutá y revisá la demo. Revisá los cambios antes de integrarlos. La demo no es research real aprobado.
4. Abrí la base de ingeniería integrada en Claude Code o en un entorno de Claude con capacidad real de editar ese mismo repo. Enviá: «Leé prompts/02_CLAUDE_DESIGN.md y mejorá la presentación sin alterar los contratos de datos». Evitá que ambos agentes modifiquen simultáneamente la misma rama.
5. Después del diseño, volvé a Codex con `03_CODEX_RELEASE_REVIEW.md`.
6. Antes del lanzamiento público, revisá las fuentes, el alcance de uso, la metodología y las observaciones reales. Aprobá expresamente lo publicable. Los prompts preparan un deploy manual, no autorizan una publicación automática.

## Distribución de responsabilidades

Codex: arquitectura, dominio financiero, datos, validaciones, tests, CI y preparación del despliegue.

Claude: jerarquía de información, identidad visual, componentes de presentación, responsive y accesibilidad de la experiencia.

Propietario: selección de fuentes, aprobación editorial, metodología de research, condiciones de uso y decisión de lanzamiento.

El repositorio y sus contratos serán la referencia compartida. AGENTS.md y CLAUDE.md ayudan a conservar instrucciones; no son mecanismos de seguridad ni reemplazan validación, tests y permisos.

## Primer hito

Una demo funcional con instituciones ficticias y dos trimestres, un modo publicado que excluye datos no aprobados, documentación metodológica y un proceso manual reproducible para incorporar la primera publicación real.

No se presupone que los bancos candidatos tengan una fuente pública comparable, una cadencia específica o permisos de reutilización. Todo eso requiere verificación.

## Referencias técnicas oficiales

Estas referencias sustentan el flujo de trabajo, no validan fuentes financieras ni conceden derechos de uso. Verificar su versión vigente al implementar.

- Codex, instrucciones de repositorio: https://developers.openai.com/codex/agent-configuration/agents-md
- Codex, prácticas de trabajo: https://developers.openai.com/codex/learn/best-practices
- Claude Code, memoria e importación de AGENTS.md: https://code.claude.com/docs/en/memory
- Claude Code, trabajo sobre una base de código: https://code.claude.com/docs/en/overview
- GitHub Pages, hosting estático: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- GitHub Pages, workflows: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- Vite, despliegue estático y base path: https://vite.dev/guide/static-deploy.html
