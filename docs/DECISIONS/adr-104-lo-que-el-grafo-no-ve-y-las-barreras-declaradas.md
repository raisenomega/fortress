# ADR-104 — Lo que el grafo no ve y las barreras declaradas: el agente sabe dónde el grafo no llega, y lee ahí

- **Estado**: Aceptada (firmada por el operador el 2026-09-24)
- **Fecha**: 2026-09-24
- **Alcance**: solo prompt, en dos piezas. (1) Los bloques «grafo primero» del
  escáner, del analista y del chat dicen las tres superficies que el grafo **no**
  indexa —directorios ocultos, carpetas en `.gitignore` aunque estén versionadas,
  y políticas SQL, GRANT y buckets— y mandan leer ahí con Read y Grep. (2) El
  escáner y el analista reciben un bloque con las **barreras declaradas** del
  proyecto, las mismas que el pre-vuelo ya parsea de `.claude/settings.json`,
  para no llegar a ciegas a la superficie donde viven. **No toca** el indexador,
  ni el binario fijado, ni la caché del grafo, ni reindexa, ni cambia el
  contrato del hallazgo.
- **Relación**: es el arco #4 del ROADMAP tras la medición que desmintió su
  premisa («el grafo solo indexa JS») · calca el patrón de **ADR-101 §2** (la
  memoria de la parada: un bloque de prompt con lo que FORTRESS ya sabe) · se
  apoya en **ADR-097 §4** (el pre-vuelo y la guarda de barrera, que leen los
  hooks del disco) · deja el alta de la 0.11.0 como arco futuro y la higiene del
  grafo como B.
- **Nace de**: las mediciones del 2026-09-24 sobre `main@541c264`: la caché real
  del grafo en solo lectura, los repos en disco, y la 0.11.0 corrida aislada.

---

## 1. Contexto

### 1.1 La premisa del ROADMAP era falsa

El ROADMAP decía que el índice no cubre `.py`, configuración ni SQL. Medido: el
binario fijado (codebase-memory-mcp 0.9.0) embebe 156 gramáticas tree-sitter y
los índices reales tienen 203 nodos Python y 1371 nodos SQL en nucleo, 1261
Prisma y 230 Terraform en Health Flow, y la configuración de raíz. Cobertura por
ficheros versionados: nucleo 99 %, FORTRESS 97 %, Health Flow 94 %.

### 1.2 Lo que sí queda fuera, y en las dos versiones

- **Directorios ocultos.** `.claude/`, `.fortress/`, `.husky/`, `.vscode/` y
  `.githooks/` no entran; solo `.github` y los ficheros sueltos con punto.
  `search_code`, que es grep, tampoco entra. La 0.11.0 lo declara al indexar:
  `excluded dirs [".claude", ".git"]`; añade `.husky/` y nada más.
- **Carpetas en `.gitignore` aunque estén versionadas.** Omega tiene `legacy/`
  en su gitignore: 572 ficheros, el 79 % de sus líneas y todo su Python,
  invisibles. Probado en las dos versiones con una carpeta versionada y
  gitignorada: excluida en ambas. Es diseño del indexador.
- **Políticas SQL.** La gramática conoce `create_policy`; el extractor no emite
  nodos de política, GRANT ni buckets en ninguna versión. Las funciones SQL sí se
  encuentran; 23 hallazgos vivos cuyo símbolo es una política dan 0 resultados.

### 1.3 Las barreras viven exactamente ahí

Los hooks de `.claude/settings.json` y sus scripts en `.claude/hooks/`,
`.fortress/config` y `.husky/pre-commit`. Hay 15 hallazgos vivos en esos
ficheros: Omega 9, ensayo-fail-closed 3, Health Flow 1, APT BY 1, nucleo 1. El
pre-vuelo los lee del disco (`barrerasDelProyecto`, `hooksDeclarados`), así que
la guarda funciona; el analista y el escáner, que obedecen «grafo primero»,
llegan a ciegas: el grafo responde cero y nadie les dice por qué.

### 1.4 El daño medido

134 de 492 vivas, el 27 %, están donde el grafo no llega: 64 sin índice, 44 en
`legacy/`, 23 políticas, 16 en directorios ocultos; 7 CRITICAL y 18 HIGH entre
las de superficie oculta, ignorada o política. De las 65 observaciones de
cobertura del grafo, 14 son sobre políticas SQL y 6 sobre handlers inline. Y el
bloque `EL_GRAFO` ya avisa de una cosa que el grafo no sabe, el retraso, pero
no de estas tres.

### 1.5 Lo que la medición descarta

- **Subir a la 0.11.0 por esto**: no cubre ni ocultos ni políticas. Aporta otras
  cosas (`detect_changes` e `index_status` para la frescura, nodos Table,
  `.husky/`, 17 herramientas en vez de 8, y un daemon por cuenta), y por eso es
  arco futuro con su propio gate, no una línea de este ADR.
- **Tocar el indexador** (Go, MIT, upstream o fork): decisión aparte; con
  cualquier versión el prompt de este ADR hace falta igual.
- **Reescribir el indexador**: sin motivo, ya lee 156 lenguajes.

## 2. DECISIÓN 1 — Lo que el grafo no ve, dicho en el prompt

Los tres bloques «grafo primero» ganan la misma advertencia, en una forma cada
uno: `EL_GRAFO` del analista (`analysis-prompt-grafo.ts`, inyectado en
`analysis-prompt.ts:44`), `GRAPH_FIRST_SECURITY` del escáner (`graph-first.ts`,
inyectado en `scan-prompt.ts:37`) y `GRAPH_FIRST` del chat (`chat-prompt.ts:42`).
El texto dice que el grafo **no indexa** (a) directorios ocultos como `.claude/`,
`.fortress/` y `.husky/`, (b) carpetas que el `.gitignore` excluye aunque estén
versionadas, y (c) políticas SQL, GRANT y buckets, aunque sí las funciones y las
tablas; y que en esas tres superficies se lee con Read y Grep sin esperar nada
del grafo. Es prompt, deriva de la realidad medida del binario, y se prueba como
el resto de bloques: un test que lo exige en los tres sitios.

## 3. DECISIÓN 2 — Las barreras declaradas, como bloque

El pre-vuelo ya parsea los hooks `PreToolUse` de `.claude/settings.json`
(`hooksDeclarados`, `hook-del-proyecto.ts:33`) y sabe si arrancan
(`barrerasDelProyecto`, `barreras-del-proyecto.ts:20`). Ese conocimiento entra
en el prompt del escáner y del analista como un bloque, calcado de la memoria de
la parada (`bloqueDeMemoria`, `scan-prompt.ts:32`): «Barreras que este proyecto
declara: N hooks PreToolUse, matcher → guion (intérprete existe o no); y
`.fortress/config` presente o ausente». Solo lo que consta; sin barreras el
bloque no se escribe. Se lee en la aplicación, como la memoria, y baja
formateado: el analista y el escáner viven en infraestructura y dominio y no
alcanzan el disco del proyecto por sí mismos. Unos cuatro ficheros: el
formateador en dominio, la lectura en aplicación, y los dos prompts.

## 4. Lo que NO está en este ADR

- El alta de la 0.11.0 (§1.5): arco futuro, por frescura y no por esto.
- La higiene del grafo: `has_graph` en 0 con el sha puesto, reindexar tras
  merges externos, mailbd sin índice. Es B, aparte, y no lo causa el grafo.
- Tocar el indexador, el binario fijado o la caché.
- Los handlers inline (`serve()`, `createServer`) que no se descomponen: son un
  cuarto hueco medido, de mailbd y del ensayo, y va a DEUDAS con su dato; no
  entra en el prompt hasta medir cuánto pesa.

## 5. Consecuencias

- **Positivas**: el agente deja de esperar del grafo lo que el grafo no puede
  dar, y lee donde toca; el escáner y el analista llegan a la superficie de las
  barreras sabiendo qué hay declarado; el texto es verdad para la 0.9.0 y para
  la 0.11.0.
- **Negativas**: tres bloques de prompt crecen unas líneas; el bloque de barreras
  añade una lectura de `.claude/settings.json` por parada y por análisis, ya
  pagada por el pre-vuelo.
- **Neutras**: el contrato del hallazgo, la identidad, el score, el push, el
  indexador, el binario y la caché no cambian.

## 6. Alternativas consideradas

- **Solo la advertencia, sin el bloque de barreras**: el agente sabría que no
  vea, no qué hay. Descartada: las barreras ya están parseadas y darlas es prompt.
- **Que el agente lea `.claude/settings.json` por su cuenta**: hoy ya puede y no
  lo hace, porque «grafo primero» lo manda al grafo y el grafo calla. Descartada.
- **Indexar los directorios ocultos en FORTRESS** (un índice propio): construir
  lo que el prompt resuelve. Descartada.

## 7. Referencias

ADR-097, ADR-101 · `src/domain/repair/analysis-prompt-grafo.ts`,
`src/domain/repair/analysis-prompt.ts` · `src/domain/settings/graph-first.ts`,
`src/domain/scan/scan-prompt.ts`, `src/domain/chat/chat-prompt.ts` ·
`src/domain/scan/memoria-de-la-parada.ts` · `src/domain/project/hook-del-proyecto.ts`,
`src/domain/project/barrera-rota.ts`, `src/infrastructure/project/barreras-del-proyecto.ts`,
`src/infrastructure/project/fortress-config.ts` · mediciones del 2026-09-24
(memoria del operador, `fortress-grafo-mas-alla-de-js-medido` y
`fortress-grafo-0-11-0-medida`).

## 8. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-24 por orden del operador, con su línea literal:

> *«YO Jojo dueño del proyecto FORTRESS firmo ADR-104: casilla 1 sí (la
> advertencia de los tres huecos en los tres bloques grafo-primero, con Read y
> Grep ahí), casilla 2 sí (el bloque de barreras al escáner y al analista),
> casilla 3 sí (la 0.11.0 como arco futuro por frescura, no por este ADR),
> casilla 4 leído §1.2 y §1.5, casilla 5 sí (los handlers inline a DEUDAS, no al
> prompt) — Jojo, 24 septiembre 2026»*

1. **La advertencia de los tres huecos** —ocultos, gitignorados aunque
   versionados, políticas SQL— en los tres bloques «grafo primero», con Read y
   Grep como camino ahí: [x] sí · [ ] otra: ________
2. **El bloque de barreras declaradas** al escáner y al analista, leído en la
   aplicación de lo que el pre-vuelo ya parsea, solo lo que consta: [x] sí ·
   [ ] solo al analista · [ ] otra: ________
3. **La 0.11.0 queda anotada como arco futuro** por frescura, nodos Table y
   `.husky/`, no por este ADR: [x] sí
4. **He leído §1.2 y §1.5**: ninguna versión cubre ocultos ni políticas; el
   prompt hace falta con cualquiera: [x]
5. **Los handlers inline van a DEUDAS** con su dato y no al prompt, hasta medir
   cuánto pesan: [x] sí · [ ] al prompt también

**Firma del operador:** Jojo, dueño del proyecto FORTRESS · **Fecha:** 24 septiembre 2026
