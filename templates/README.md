# templates/ — Kit universal de FORTRESS

Plantillas universales que FORTRESS distribuye a otros proyectos: doctrina de
agente (CLAUDE.md), blueprint de arquitectura, checklist de auditoria, playbook
de despliegue, framework de seguridad, motor cognitivo, seleccion de agentes,
cerebro de proyecto (COGNITION-LOG) y herramientas shell/JSX del kit.

**NO son documentacion de FORTRESS mismo.** La documentacion del proyecto
FORTRESS Command Center vive en `docs/` (en construccion, Fase 1 de la guia
documental) y en los documentos operativos de la raiz (`CLAUDE.md`,
`ARCHITECTURE.md` — hasta su traslado a `docs/` — y `README.md`).

Cada archivo de esta carpeta lleva un encabezado que lo marca como plantilla
universal, en la sintaxis de comentario de su tipo (`<!-- -->` en Markdown,
`#` tras el shebang en shell, `/* */` en JSX).

## Origen

Importados el 2026-08-10 desde el kit del operador (carpeta padre del repo),
como parte de la tarea 0.1 de la guia de documentacion (rama
`docs/fase-0-higiene-estructural`).

## Fuente de verdad hoy

Verificado el 2026-08-10 contra el codigo real: **ninguna pieza de `src/` lee
esta carpeta.** La generacion de gobierno para proyectos nuevos funciona asi:

1. `src/domain/chat/governance-templates.ts` hard-codea 3 plantillas minimas:
   `.gitignore`, `.env.example` y un COGNITION-LOG generacion 0 reducido
   (NO la version completa del kit que esta aqui).
2. Los 7 documentos restantes (`CONSTITUTION.md`, `DDD-RULES.md`,
   `SECURITY-BASELINE.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`,
   `PROJECT-STATE.md`) los REDACTA el agente durante la configuracion guiada
   (`DRAFTED_DOCS` en `src/domain/chat/config-docs.ts`), envueltos en
   marcadores `<<<FORTRESS-DOC:` que la app escribe a disco de forma
   determinista (`governance-files.ts`).

Por tanto: hoy la fuente de verdad del scaffolding son los strings en
`governance-templates.ts` mas la redaccion del agente. Estos archivos en
`templates/` son la version legible y auditable del kit para humanos.

**Deuda anotada:** refactor futuro para que la generacion (plantillas en
codigo y/o prompts del agente) consuma o referencie `templates/` como fuente
unica, si se decide unificar.

## Empaquetado

Esta carpeta esta EXCLUIDA del binario (`!templates/**` en
`electron-builder.yml`): el kit se distribuye a proyectos, no viaja en el asar.
