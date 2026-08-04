# Estado_fortress.md — Fuente única de verdad

Este documento es el registro operativo de FORTRESS. by Raisen. Dice qué está
**construido y verificado**, qué es **deuda pendiente**, y en qué orden se ha
ido levantando. Se actualiza según construimos. Si algo no está aquí, no está
hecho; si aquí dice "operativo", es porque pasó verificación real.

Regla de honestidad: nada se marca operativo sin evidencia (test, captura o
comprobación en disco). La deuda se registra tal cual, sin maquillar.

---

## 1. Qué es FORTRESS

App de escritorio (Electron + React + TypeScript) para auditar y mantener
varios proyectos de código con agentes de Claude Code. Ejecuta de verdad
dentro de cada proyecto: lee archivos, escanea seguridad, orquesta agentes y
mira la web desde fuera. No es un chat bonito; es un agente que actúa, con
frenos.

- **Repositorio:** raisenomega/fortress (privado)
- **Binario:** `~/Escritorio/Raisen_FCC/dist/FORTRESS-1.0.0.AppImage`
- **Instalado en:** `~/.local/bin/fortress`
- **Base de datos:** `~/.config/fortress-command-center/fortress.db` (SQLite)

---

## 2. Arquitectura y reglas (no negociables)

- **DDD estricto:** `domain/` (puro, sin Electron/React/SQLite) → `application/`
  (casos de uso) → `infrastructure/` (SQLite, Anthropic, filesystem, git) y
  `presentation/` (React). Dependencias hacia adentro.
- **Máximo 75 líneas por archivo**, verificado por ESLint. Sin excepciones.
- **Seguridad:** `contextIsolation: true`, `nodeIntegration: false`. La API key
  se cifra con `safeStorage` y nunca cruza al renderer ni al repo.
- **Verificación de tres capas:** vitest (dominio puro) · integración Electron
  (renderer→preload→IPC→SQLite, con userData temporal y PATH recortado) ·
  smoke/preview visual.

Estado de verificación al día de hoy: **437 unitarios · 103 integración ·
migración · smoke · preview**, todo en verde. Cero archivos > 75 líneas.

---

## 3. Operativo (construido y verificado)

En orden de construcción:

1. **Base Electron + tema OMEGA** — negro/dorado, Syne + DM Sans, Sidebar +
   TopBar + Chat. `8bd8076`–`a212561`
2. **Persistencia SQLite** — proyectos e historial de chat por proyecto. `e38324a`
3. **Chat con la API + streaming + chips** de agente/proyecto/modo. `8b7bcf0`–`79d40b9`
4. **Alta de proyecto** con selector de carpetas y autodetección de stack. `4ac77a5`
5. **Vista multi-proyecto** con gauges de score. `ddcd03c`
6. **Modo supervisado/autónomo** persistente e inyectado al modelo. `5f1f219`
7. **Settings + validación de API key + onboarding**. `1a869a8`
8. **Self-diagnostics** con semáforo en el StatusBar. `bf843ba`
9. **Distribución** — AppImage, icono, acceso directo, install.sh. `8abddbe`
10. **Marca + cero emojis** (Lucide) + los 10 agentes (incl. E2E Runner). `fc295c4`, `7b35242`
11. **Ejecución real de Claude Code** dentro del proyecto (cwd, `-p`, no
    `--headless`/`--project` que no existen). `e0eb097`
12. **Escáner de seguridad real** — hallazgos persistidos, score determinista,
    push bloqueado por CRITICAL. `9ff562d`, `2b4b566`
13. **Telemetría** — tokens y coste reales del CLI. `5a4913c`
14. **Histórico de escaneos + descarte de falsos positivos**. `fc3d9ca`
15. **Registro de actividad** de los agentes (sin guardar comandos de bash). `3e4216f`
16. **Despacho real de los 10 agentes** vía `--agents`/`--agent`. `e0828a8`
17. **Paneles:** tokens en StatusBar, Cognition, modal por agente, timeline
    filtrable, dashboard de rendimiento. `f9f622c`–`88240e3`
18. **Knowledge Graph:** detección honesta (sin lector todavía). `63f2718`
19. **Reinicio en caliente** y sidebar plegable/secciones. `46c558d`, `0c858ad`
20. **Workflows orquestados** — un mensaje enruta a un workflow; los toggles
    EXCLUYEN agentes; plan antes de ejecutar en supervisado. `09a2669`
21. **Nuevo Proyecto — Fase 1:** elegir carpeta destino y crearla con guardas. `ca51331`
22. **Correcciones de coste/cuenta:** el coste era real (API key anula la
    suscripción), topes configurables, lista blanca de settings, conectar la
    cuenta de Claude con la API key como alternativa. `e0f0bd6`–`01dbae3`
23. **Endurecimiento de seguridad:** 3 de 4 hallazgos del propio escaneo
    (concurrencia en el main, openExternal validado, CSP base-uri/form-action). `21bc36c`
24. **Superficie externa (posture):** audita la web desde fuera, solo lectura,
    con confirmación de propiedad y niveles de cobertura. `1e74736`
25. **Aislamiento entre proyectos:** cabecera de chat por proyecto; streaming,
    error y medidor por proyecto; medidor de agentes en vivo; quitar proyecto. `4664868`, `0b9dc9d`
26. **Preguntas libres se responden en prosa** (no se fuerza el informe). `45c0db2`
27. **Autoverificación del agente:** lista blanca de `typecheck`, `lint` y
    `test:unit` — el agente puede verificarse y nada más. `e60d94d`
28. **Conectores MCP (D3, completo):** panel + persistencia + toggles + MCP
    custom (por el agente), y el cable vivo — los MCP activos llegan al spawn
    del chat. Verificado con spawn real: un conector activo no rompe el run, y
    una URL mala degrada sin fallar. El escaneo no recibe MCP a proposito.
29. **Los dos bucles de aprendizaje cerrados:** (a) el prompt del agente le
    ordena autoverificarse tras editar (correr typecheck/lint/test:unit de su
    lista blanca y arreglar lo rojo) — **validado en vivo:** un spawn réplica de
    FORTRESS editó un archivo y corrió los tres checks en orden (344 tests en
    verde), mientras el allowlist **denegó** un `node -e` fuera de la lista
    ("This command requires approval"); (b) tras cada escaneo FORTRESS escribe una
    reflexión determinista en el COGNITION-LOG.md del proyecto (score +
    hallazgos), por un puerto que respeta DDD. Un test de round-trip garantiza
    que lo escrito es exactamente lo que el panel lee. `09ecdcc`. **Fix de
    refresco** (descubierto monitoreando en vivo): el panel solo releía Cognition
    al cambiar de proyecto; ahora también tras el escaneo que crea el log. `652c3ab`
30. **Guarda de áreas protegidas en español (hallazgo del propio escáner).** En
    autónomo, un prompt en español ("refactoriza la autenticación", "cambia los
    pagos", "revisa la seguridad") NO degradaba a supervisado: `PROTECTED_AREAS`
    solo tenía inglés y comparaba con `includes()` literal. Fix fail-safe: lista
    ES+EN + normalización de acentos (NFD). `password/contraseña` ahora sí cubre.
    Tests de detección en español con y sin tildes. `a3ded40`
31. **Gate de confianza por proyecto (cierra el filo del allowlist).** Flag
    `trusted` por proyecto, **default false** (modelo Workspace Trust). El
    allowlist de autoverificación solo se pasa cuando el agente **edita**
    (acceptEdits) **Y** el repo es de confianza; el escáner nunca se
    autoverifica (auditar es mirar). Toggle en la cabecera del chat. Regla única
    en el dominio (`selfVerifyRules`), migración aditiva, tests de las 3
    combinaciones. `02a1706`
32. **SENTINEL OMEGA — meta-auditor (6 fases).** El 11º agente, opcional, con
    carta honesta (testigo-no-actor, evidencia-o-silencio, discrepancia-no-
    intención, falible-por-diseño). **Fase 1** agente+carta `5d7b466`. **Fase 2**
    Libro de la Vida: log append-only sin cascada — sobrevive al proyecto
    `edae60e`. **Fase 3** motor de verificación: cada hallazgo vs filesystem
    real, discrepancia con evidencia, sonda solo-lectura con guarda de path
    traversal `8643c4b`. **Fase 4** puntuación multidimensional solo con datos
    reales (veracidad/cumplimiento), `null` sin evidencia `28fa8f9`. **Fase 5**
    panel + vista comparativa reportado-vs-verificado `8a0c950`. **Fase 6** veto
    de push respaldado por evidencia (no afloja la regla, la documenta) `55efad8`.
    Rehusadas a propósito (harían a OMEGA violar lo que vigila): toggle que
    miente, pensamiento inferido, perfiles psicológicos, veredicto infalible.
33. **OMEGA superdashboard + activación.** OMEGA pasa a agente activo por
    defecto; chip dorado "OMEGA" (ojo) en el TopBar junto a Rendimiento `78b6d51`.
    Capa de datos real: `omega.agents` (salud de los 11 agentes: ejec./fallos/
    cumplimiento/tokens), `omega.runs` (ejecuciones recientes), `omega.snippet`
    (código real de la evidencia, con guarda de path traversal) `2283939`.
    Página completa dedicada: cabecera con métricas del log, puntuación, tabla
    macro de agentes (fila→perfil micro), y Libro de la Vida con "ver evidencia"
    (código real, no CVEs inventados) `fb08f4b`. Omitidas del spec por
    integridad: columnas mentiras/omisiones, profundidad, percentiles, CVEs
    concretos, borrar registros >90d (viola log eterno), reiniciar/restringir/
    bloquear agente (viola testigo-no-actor).
34. **OMEGA superdashboard — estructura completa del spec (3 fases).** Header
    global (§1): título+"el ojo que todo lo ve", `FORTRESS v1.0.0` real, estado,
    integridad %, alertas por severidad, acciones (Actualizar/Exportar-JSON/
    Configurar/Auditar) `cdf0262`. Tabla macro (§2): 5 columnas exactas
    (Confiab./Efic./Profund./Discrep./Omisiones), ordenable, colores; perfil
    micro (§3) con percentil real dentro del sistema, historial y discrepancias
    `b408238`. Estadísticas globales (§7) + comparativa de 2 agentes (§8)
    `2c667ff`. Celdas sin dato → `s/d` (no se inventan); §4 cubierto con niveles
    reales (resumen→evidencia→código en disco), sin CVEs inventados; §5/§6
    acciones destructivas rehusadas (testigo-no-actor + log eterno).
35. **Grafo cableado + guía por rol + lector del panel (cierra D2).** El grafo
    (MCP codebase-memory) viaja en `--mcp-config` y `--allowedTools` en CADA
    spawn (`54c927e`); guía por rol (seguridad localiza, estructural rastrea,
    `515a593`); el panel lee el índice real (nodos/aristas/archivos, `2d41359`);
    telemetría de herramientas por agente (`c7f60fe`). Verificado en vivo: los
    agentes estructurales usan get_architecture/search_graph/trace_path.
36. **Loop autónomo — Fase 1 (5 incrementos).** Checkmark junto a confianza,
    deshabilitado sin topes guardados (obligatorios) + confianza. Ciclo en el
    main aislado por proyecto: escaneo→+5s→arreglo→verify→re-escaneo→+10s→repite.
    Frenos: tope de gasto de sesión + nº de ciclos + parada 3×100. Resiliencia:
    STANDBY por fallo transitorio (crédito/API/red) + sesión persistida que
    REANUDA tras reinicio (nada se pierde). Reparación real: edita en acceptEdits
    + verify (typecheck) + red git (checkpoint/revert, solo si la carpeta es raíz
    del repo). Guardia de degradación: revierte si un arreglo baja el score.
    Estado en HUD + pie; botón Detener rojo lo para. `3a44f00`–`fe0cf8c`, `299b5dd`.
37. **Loop autónomo — Fase 2 (debate juez/defensa).** Al degradar, prueba
    alternativas (el intento avisa al agente que el anterior empeoró); el JUEZ es
    el re-escaneo objetivo; se queda con el que mejore o para con `sin-solucion`
    tras 2 rondas. `5079885`.
38. **Endurecimiento (hallazgos del propio escáner, con test de regresión).**
    `window.electron` retirado (filtraba process.env+ipcRenderer, `bae3b2b`);
    `integration-test` ya no da falso verde si una suite lanza (`eb292b2`);
    `guardRun` y `trusted` cubiertos por tests (`0b83c23`); el repo auditado no
    puede suplantar al `security-reviewer`/`sentinel-omega` (`ff83cce`).

---

## 4. Garantías de aislamiento (auditadas)

- Chat, hallazgos, escaneos, telemetría y actividad → todo por `project_id` en
  SQLite. Quitar un proyecto borra lo suyo por cascada.
- Cada agente se ejecuta con `cwd` en la carpeta de SU proyecto.
- `git push` usa el `cwd` del proyecto: dos remotos distintos empujan cada uno
  al suyo. FORTRESS no gestiona la identidad de git; usa la del proyecto.
- Estado de UI (streaming, error, medidor) por proyecto: correr A y B a la vez
  no los confunde.
- La API key nunca cruza al renderer; los settings tienen lista blanca.

---

## 5. Deuda registrada (pendiente)

Ordenada por lo que desbloquea más:

- **D1 — Nuevo Proyecto, Fases 2–5.** Hoy solo se crea la carpeta (Fase 1).
  Faltan: documentación generada (ARCHITECTURE/CLAUDE/COGNITION/.gitignore/
  .env.example/README), scaffold vía CLI, sistema FORTRESS (agentes en disco,
  routines, hooks), primer scan y alta en el sidebar. **La pieza grande.**
- **D2 — Lector del Knowledge Graph (RESUELTO 2026-08-04, ver operativo §35).**
  `codebase-memory-mcp` (MIT, v0.9.0) instalado en scope **user** y verificado:
  conecta, indexa el repo (2745 nodos / 6699 aristas), y un spawn tipo-FORTRESS
  ve sus 14 tools (`index_repository`, `get_architecture`, `search_graph`,
  `trace_path`, `get_code_snippet`…). **Los agentes ya lo usan** (scope user +
  `--mcp-config` no-estricto = fusiona). Formato conocido: `project` = path
  slugificado, nodos Function/File/Interface/Route, aristas CALLS/IMPORTS/USAGE.
  CLAUDE.md raíz corregido: `get_callers()` no existe → `trace_path`/`search_graph`.
  **HECHO:** el panel lee el índice real (`~/.cache/codebase-memory-mcp/<slug>.db`:
  nodos/aristas/archivos/fecha), `2d41359`.
- **D4 — Pipeline de despliegue** (Supabase/Vercel desde el chat). No construido.
- **D5 — Instalador universal** (`fortress-full-installer.sh`) + onboarding
  visual de 5 pantallas para no técnicos. No construido.
- **D6 — Sandbox de Chromium (RESUELTO 2026-08-04).** `main-window.ts` pasó a
  `sandbox: true`. Fue posible tras retirar `window.electron` (el preload solo
  usa `ipcRenderer`/`contextBridge`, sin node). Verificado con `smoke` + `preview`
  (montan la UI real y ejercen el bridge): la app arranca y pinta con el sandbox
  encendido.
- **D7 — Sección "Record"** que conserve lo importante de un proyecto tras
  quitarlo. Propuesta: exportar `FORTRESS-RECORD.md` a la propia carpeta del
  proyecto, no guardarlo dentro de FORTRESS (evita proyectos fantasma).
- **D8 — Hallazgos de seguridad del propio FORTRESS.** Validados uno a uno.
  **Cerrados:** MEDIUM `operation-mode.ts` (`a3ded40`), MEDIUM `safe-commands.ts`
  (`02a1706`), MEDIUM `main-window.ts` (=D6 sandbox, `6bb5c1b`), HIGH
  `window.electron` (`bae3b2b`), MEDIUM integridad del auditor (`ff83cce`), HIGH
  falso verde de integration-test (`eb292b2`), LOW `posture-handlers.ts` (ahora
  pasa por guardRun con clave 'posture'). **Evaluado como no-defecto:** LOW
  `index.html` CSP — `frame-ancestors` se IGNORA vía `<meta>` (solo header) y en
  Electron el renderer es un archivo local no embebible; el `unsafe-inline` es
  solo de `style-src`, compromiso aceptado de Tailwind. **D8 cerrado.**
- **D9 — Topes de gasto (RESUELTO 2026-08-04).** El tope diario, que se había
  puesto en 0 para probar el grafo, se REACTIVÓ a `budget_per_day_usd = 50`: un
  backstop muy por encima de un workflow (~$16) que corta un desbocado, ajustable
  en Configuración. Ademas el loop autónomo tiene sus PROPIOS frenos obligatorios
  por sesión (tope de gasto + nº de ciclos, sin defaults, exigidos por el gate
  del toggle), así que no puede correr con presupuesto ilimitado. El tope por
  ejecución sigue en $3.

---

## 6. Comandos de verificación

```bash
npm run typecheck        # tipos (node + web)
npm run lint             # incluye max-lines y no-explicit-any
npm run test:unit        # dominio puro (vitest)
npm test                 # unit + integracion + migracion
npm run smoke            # monta la UI real, falla si no pinta
npm run preview          # siembra datos y captura cada pantalla
npm run verify:scan      # escaneo REAL contra un proyecto vulnerable (minutos)
npm run build:linux      # AppImage
```

El agente dentro de FORTRESS puede correr por su cuenta `typecheck`, `lint` y
`test:unit` (lista blanca); cualquier otro comando sigue necesitando permiso.
