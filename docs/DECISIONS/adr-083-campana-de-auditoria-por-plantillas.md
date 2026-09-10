# ADR-083: La campaña de auditoría — las 17 plantillas refuerzan el escaneo, no lo sustituyen

- **Fecha:** 2026-09-10
- **Estado:** Aceptada
- **Área:** Escaneo · Auditoría · Arquitectura

## Contexto

El escaneo de FORTRESS sabe hoy tres cosas que hace un año no sabía, y las tres
son de las plantillas sin que nadie lo dijera.

**Sabe nombrar lo que encuentra.** 27 tipos de defecto de vocabulario cerrado
derivados de dos corpus reales ([ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md)),
con la severidad derivada por código de tres ejes y no por la palabra del modelo
([ADR-080](adr-080-severidad-por-ejes-derivados.md)).

**Sabe cuánto miró.** El recorrido por paradas mide el proyecto, lo reparte por
carpeta, guarda cada parada al terminarla y declara «audité X de Y ficheros»
([ADR-082](adr-082-escaneo-por-paradas-con-cobertura-declarada.md)).

**Sabe lo que gastó, deje como deje.** Factura real y transcripción en disco
aunque el escaneo muera.

### El arco de paradas construyó media auditoría sin nombrarla

Medido contra el kit el 2026-09-10, y esta es la razón de que este ADR exista
ahora y no antes:

| Pasada | Antes del arco | Hoy |
|---|---|---|
| **P1 Recon** | ~15 % | **~45 %** — el manifiesto **ES** el inventario por comando; `stack.ts` clasifica; `discoverCorpus` hace docs↔realidad |
| **P2 Adversarial** | ~40 % | ~40 % — la checklist y los 27 tipos |
| **P3 Backend línea por línea** | ~20 % | **~50 %** — la cobertura declarada **ES** lo que P3 exige para poder llamarse línea por línea |
| **P4 Cliente + datos + IaC** | ~15 % | ~20 % |
| **P5 Vivo + atestación** | ~25 % | ~30 % — probes reales, gate, posture |

La «Visión documentada» de ADR-082 lo anticipó: *«el manifiesto (medir) ES P1
Recon; cada parada por carpeta ES un pedazo de P3/P4 línea por línea»*. Este ADR
es el arco que aquella nota dejó pendiente.

### Lo que hay, y lo que se pide

En `internal/AUDIT-KIT/` viven **17 plantillas de auditoría de grado bancario**
—5 pasadas (P1–P5) y 12 módulos (M1–M12)—, agnósticas de stack, con postura de
cero tolerancia, verificación viva y dictamen GO/NO-GO. Son el **cerebro**
propietario del auditor: doctrina, no ejecutable.

El encargo del operador, literal: **las plantillas REFUERZAN y AMPLÍAN lo que el
escaneo ya hace — no reemplazan ni sustituyen.** Maximizan la profundidad
verificable hacia un escaneo de grado enterprise real.

Este ADR fija la arquitectura. **No construye nada.**

## Decisión

### 1. Las plantillas CONVIVEN con la checklist. No la reemplazan

Sustituir la `SECURITY_CHECKLIST` por prosa de plantilla parece el camino corto
y es el error. **Sus cinco familias están atadas a los 27 tipos del
`REPORT_CONTRACT`**: ADR-081 derivó ese vocabulario *de esas familias*, contando
filas reales de dos corpus. Cambiar la checklist dejaría al modelo eligiendo de
una lista que ya no describe lo que se le pide buscar — exactamente el destrozo
que ADR-081 vino a cerrar, y que costó 111 de 119 filas mal clasificadas.

**Lo que las plantillas aportan es PROFUNDIDAD TEMÁTICA encima**: M8 pregunta
por atomicidad e idempotencia, M2 por restaurabilidad, M12 por trazabilidad —
cosas que ninguna de las cinco familias nombra. Eso es prosa que se suma.

**El contrato de salida NO cambia.** Los 27 tipos, los 3 ejes y la banda
derivada siguen siendo los mismos. Una plantilla dice **qué mirar**; el contrato
dice **cómo se reporta**, y esa separación es lo que mantiene la identidad de
los hallazgos estable entre escaneos.

### 2. DOS CLASES DE PARADA

`Parada` gana una forma discriminada, porque las plantillas se reparten en dos
naturalezas que no admiten el mismo trato:

**Paradas-de-CARPETA** (las de ADR-082, sin cambios). P3/P4 línea por línea, más
los módulos que viven en carpetas: **M9** accesibilidad sobre la UI, **M8**
integridad de negocio y **M3** privacidad sobre servidor y datos.

**Paradas-de-TEMA** (nuevas). **M2** DR/BCP, **M7** gobernanza del SDLC, **M4**
supply-chain, **M11** continuidad, **M12** observabilidad. Miran el **proyecto
entero, una vez**, porque no viven en ninguna carpeta: *la restaurabilidad de un
backup no cambia según en qué carpeta se mire*. Preguntar por DR doce veces, una
por carpeta, no es más riguroso: es la misma pregunta doce veces.

### 3. Qué plantilla aplica se decide en el RECONOCIMIENTO, no en el recorrido

Es una decisión del **manifiesto** —se toma midiendo, antes de escanear nada— y
por tanto entra en lo que el escaneo promete cumplir.

**Determinista donde hay señal de fichero.** El molde existe y está probado:
`stack.ts` es un detector puro que decide de `StackEvidence { files,
dependencies }` sin modelo y sin tocar disco desde el dominio. Misma forma que
`profundidadDe` del manifiesto.

| Módulo | Señal |
|---|---|
| **M9** Accesibilidad | hay `.tsx` / `.jsx` / `.vue` / `.svelte` |
| **M5** Gobernanza de IA | dependencia `openai` / `@anthropic-ai/*` / `langchain` |
| **M4** Supply-chain | `package.json` / `requirements.txt` / `go.mod` |
| **M7** SDLC | `.github/workflows` / `.gitlab-ci.yml` — `operation-probe` ya lo mira |
| **M2** DR/BCP | `docker-compose`, IaC, `supabase/` |
| **P3 / P4** | hay carpetas de servidor y de cliente |

**M8 (dinero) y M3 (privacidad) NO se detectan por fichero.** «Toca valor» no es
una dependencia, y un `grep` de `price|balance|charge` marca cualquier tienda
que solo *muestre* precios; `email|phone` marca hasta un formulario de contacto.
Para esos dos, dos vías en orden:

1. **El operador declara** cuáles aplican. Rápido y sin ambigüedad, como ya
   declara `trusted` o el corpus (`readCorpusConfig` sustituye lo descubierto
   cuando existe: quien declara sabe mejor).
2. **Si no declara, un agente juzga con EVIDENCIA OBLIGATORIA** y vocabulario
   cerrado: `aplica: si|no|no-consta` · `porque: <fichero:línea>`. **Prosa sin
   evidencia no cuenta.** La lección de ADR-081 no es «el modelo no sirve» sino
   «un juicio con evidencia es auditable y la prosa no».

**Las 5 pasadas P1–P5 aplican SIEMPRE** — son el núcleo. Los 12 módulos aplican
según lo que el proyecto **es**.

### 4. Lo que NO aplica se DECLARA, no se calla

El manifiesto registra **«M2 NO APLICA porque \<razón\>»**, y el informe lo
transcribe.

Es la doctrina de `ausencia.ts` subida un nivel: *no nombrar algo no es afirmar
que no está*. Un módulo que se salta en silencio es indistinguible de un módulo
que se olvidó, y esa diferencia es justo la que una auditoría tiene que poder
demostrar. Un descarte con su razón es una decisión; un hueco, un descuido.

### 5. Las plantillas viven en `userData/audit-kit/`, sembradas por el operador

**El binario NO las empaqueta, y es decisión firmada.** `electron-builder.yml`
excluye `internal/**` *y* `templates/**` en su propia capa, porque
[ADR-058](adr-058-capas-de-exclusion-explicitas.md) fijó que el `.gitignore` y
el empaquetado son capas distintas y cada una declara la suya. Y aunque
estuvieran en disco, el binario instalado **no sabe dónde está el repo**.

Van a `userData`, junto a `fortress.db`, los worktrees del motor y los
`scan-logs`. Es el patrón **cerebro / ejecutor**: la doctrina es del operador y
viaja con él; el ejecutor no la lleva dentro.

**Si faltan, el escaneo lo DICE y sigue con la checklist de hoy.** No revienta.
Es la doctrina de `import-attended` palabra por palabra: *«Que no exista NO es un
fallo del sistema sino del orden de los pasos, y se dice así: el operador tiene
que saber que le falta escribirlo, no creer que algo se rompió.»*

**Al prompt viaja un RESUMEN accionable, no la plantilla cruda.** Pesan entre
4,5 y 12 KB; meter M8 entera en doce paradas multiplicaría el contexto por doce
para repetir la misma prosa. Lo que el agente necesita es la checklist de la
plantilla, no su exposición de motivos.

### 6. El entregable: un informe `AUDIT_*.md` exportable

Con **cobertura declarada**, **cadena de custodia** (HEAD —`headSha` ya está en
`AppContext`—, versiones de herramientas y hashes SHA-256, con precedente en
`probe/snapshot.ts`) y **qué se descartó y por qué**.

El molde son dos piezas que ya existen: `export-observations` da la forma del
acto —destino en `userData`, y un `Result` que **cuenta el fallo** porque *decir
que se exportó cuando no se pudo sería mentir sobre lo único que el operador
vino a hacer*—; `write-cognition-log` da la técnica de componer markdown.

**Los datos ya están todos en la base**: hallazgos con identidad y ciclo de
vida, cobertura, `estado` y `motivoCierre`, la factura por corrida, la
transcripción. Falta el compositor y el formato, no la información.

## Arquitectura por fases

Cada fase es **su propio arco de commits con gate**, probada de punta a punta
antes de la siguiente. El orden entrega valor temprano sin bloquearse en la
arquitectura completa.

| Fase | Qué |
|---|---|
| **1** | **Detección determinista**: el manifiesto declara los módulos aplicables por señal de fichero (molde `stack.ts`), más la declaración del operador para M8/M3 |
| **2** | **Plantillas de carpeta**: M9/M8/M3 resumidas en el prompt de las paradas-de-carpeta que aplican |
| **3** | **Paradas-de-tema**: `Parada` gana su forma discriminada; M2/M7/M4/M11/M12 como pasadas del proyecto entero |
| **4** | **El juicio con evidencia** para M8/M3 cuando el operador no declara |
| **5** | **El compositor** del informe `AUDIT_*.md`, con cobertura y cadena de custodia |

La 1 y la 2 ya dan profundidad real sin tocar la forma de `Parada`. La 3 es la
que cambia el tipo, y llega cuando las dos anteriores estén probadas.

## Consecuencias

- **`Parada` gana una forma discriminada** (`carpeta` | `tema`), y el manifiesto
  gana `modulosAplicables` y `modulosDescartados` con su razón. Hoy
  `Manifiesto { paradas, ficherosTotal }` es puro conteo; pasa a llevar también
  lo que el reconocimiento decidió.
- **Cuesta más, y se acepta a sabiendas.** Las paradas-de-tema son ~5–7 pasadas
  extra sobre el proyecto entero. Un escaneo de grado bancario costará más que
  el de hoy: es el precio de la profundidad, y el operador lo acepta como aceptó
  el sin-freno-de-gasto de la Enmienda 2 de ADR-082 — **el compromiso es con lo
  que el reconocimiento determinó**, no con un presupuesto.
- **No cruza innegociable** si la configuración de plantillas vive en `settings`
  o en `userData`. **`.fortress/config` SÍ es innegociable** —se cubre a sí
  mismo en `AUTONOMY_RULES_FILES`— así que declarar ahí qué módulos aplican
  exigiría firma. Se evita por construcción.
- **El contrato del escáner no se toca.** 27 tipos, 3 ejes, banda derivada,
  identidad estable. Lo que cambia es cuánto se mira, no cómo se nombra.
- **La cobertura declarada gana una segunda dimensión.** Hoy dice «X de Y
  ficheros»; pasará a decir también «N de M módulos aplicables», y cuáles se
  descartaron. Las dos cifras son cobertura, y ninguna sustituye a la otra.

## Alternativas descartadas

**(A) Producto cartesiano: cada parada corre todas las plantillas aplicables.**
Cobertura máxima sobre el papel. 12 carpetas × 6 módulos = **72 pasadas**, del
orden de $190 por escaneo a los precios medidos, y **desperdicia los módulos
transversales**: preguntar doce veces por la restaurabilidad de un backup no da
doce respuestas, da la misma doce veces. Además `paradasTotal` dejaría de
significar lo que significa hoy.

**(B) Plantillas dentro de la parada, sin paradas-de-tema.** La más barata: no
toca la forma de `Parada` y las doce pasadas siguen siendo doce. Pero **deja
M2, M7, M4, M11 y M12 sin ejecutar**, porque no tienen carpeta donde correr.
Cinco de doce módulos que nunca se auditarían — y son justo los que ninguna otra
parte del sistema cubre.

**Reemplazar la checklist por las plantillas.** Rompe el vocabulario de
ADR-081: los 27 tipos se derivaron de las cinco familias, y sin ellas el modelo
elige de una lista que ya no describe lo que busca.

## Código

Ninguno todavía: esta decisión precede a su implementación, como ADR-082.

## Referencias

- [ADR-082](adr-082-escaneo-por-paradas-con-cobertura-declarada.md) — el
  recorrido por paradas y su «Visión documentada», que dejó este arco anotado.
- [ADR-081](adr-081-el-vocabulario-de-tipos-cubre-codigo-ajeno.md) — el
  vocabulario que las plantillas NO deben romper.
- [ADR-080](adr-080-severidad-por-ejes-derivados.md) — la banda por código.
- [ADR-058](adr-058-capas-de-exclusion-explicitas.md) — por qué `internal/` no
  viaja en el binario, y por qué eso es una capa propia.
- [ADR-065](adr-065-nada-muere-sin-juicio.md) — la doctrina de la ausencia, que
  aquí sube de los hallazgos a los módulos.
