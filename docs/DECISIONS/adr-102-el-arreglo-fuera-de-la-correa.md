# ADR-102 — El arreglo fuera de la correa: el analista dice dónde va el fix y el Motor no paga por generar lo que no cabe

- **Estado**: Propuesta (sin firmar)
- **Fecha**: 2026-09-23
- **Alcance**: dos piezas dentro del Motor, y solo del Motor. (1) El análisis (C2)
  lleva una clave estructurada `arreglo` con el fichero y la línea donde VA el
  cambio, distinta o no del ancla. (2) Un guard antes del generador (C3) que,
  si ese fichero no cabe en la correa ni en el terreno que el proyecto declaró,
  rechaza la propuesta ANTES de gastar, con un motivo propio que no se reintenta
  y que pausa el hallazgo hasta que el terreno cambie. **No toca** la identidad
  de ADR-084, ni la tabla `findings`, ni la UI, ni la extinción, ni el Terminal,
  ni la correa de ADR-012: el arreglo no la ensancha, solo evita el gasto.
- **Relación**: se apoya en **ADR-012** (un hallazgo, un fix; la correa sale del
  campo estructurado y la prosa solo aporta pistas) y lo deja intacto · afina
  **ADR-028 / D24** (solo los rechazos de razonamiento se reintentan: este no es
  de razonamiento, es de terreno) · usa el patrón de **ADR-101 §3**
  (`mismoDefectoQue`: una clave estructurada en el análisis, persistida gratis
  en el Libro) · respeta la doctrina de los dos mundos (**ADR-090 §0**: el Motor
  repara solo a FORTRESS; el Terminal no lleva correa y no cambia).
- **Nace de**: la medición del 2026-09-23 sobre `main@5e70276` y la base viva en
  solo lectura, pieza «ancla frente a arreglo» del arco #3 del ROADMAP.

---

## 1. Contexto

### 1.1 El ancla es un solo lugar, y la correa sale de él

El hallazgo tiene un lugar: `file:line` (más `tipo` y `simbolo`), y ese lugar es
su identidad (ADR-084). De él salen todos los consumidores medidos: la fila que
ve el operador (`FindingRow.tsx:27-28`, solo `fichero:linea`), la memoria del
escáner y los hermanos, la extinción (`extinguirSiObsoleto` busca el marcador en
el fichero del ancla) y la correa del Motor. La correa (`generate-setup.ts:42-44`
→ `computeAllowedFiles`) es el ancla, sus tests hermanos y, del `where`, solo
paths del MISMO directorio; más los globs que el proyecto declare en
`.fortress/config` (`allowsFor`). El veto real llega DESPUÉS del diff
(`checkScope`, en `verify-and-commit.ts`): el generador ya corrió.

### 1.2 El `where` del analista es prosa y vive solo en el Libro

El formato le dice al analista que el ancla es donde se DETECTÓ y que `where`
puede apuntar a otro sitio (`analysis-prompt-formato.ts:29-34`). El texto no
muere: se asienta como `evidenceJson` de la transición y `loadAnalysis` lo relee
para el generador. Pero es prosa: de 171 análisis persistidos con `where`, 76
empiezan por un path; el resto es párrafo. No se puede convertir en campo
parseando, y ADR-012 ya midió que una correa construida sobre esa prosa rechazó
un fix válido (I2.1). Lo que hoy existe es un campo que dice «el arreglo va en
otro sitio» sin que ninguna máquina pueda leerlo.

### 1.3 El problema real es más pequeño de lo que decía el número

El backlog citaba 19 observaciones y 59 avistamientos en 4 proyectos. Recontado
sobre la base (expresión sobre área y nota): 36 observaciones, 62 avistamientos,
3 proyectos, y 27 de esos avistamientos son UNA observación sobre la falta de
git, ajena al ancla. El caso `storage.py:52` no existe en la base. Lo que queda
se parte en dos patrones que no son el mismo problema:

- **Patrón A, «línea que ya no es»** (11 observaciones, todas de FORTRESS): el
  ancla cae hoy en un comentario, una llave de cierre, un import o un `return
  new Promise`, porque el fichero creció por encima. Es deriva de LÍNEA:
  terreno de la identidad y el reanclaje (ADR-067, ADR-084), no de este ADR.
- **Patrón B, «declara aquí, arregla allá»** (9 a 10 observaciones, FORTRESS y
  nucleo): el ancla en `application` cuando la regla DDD obliga a arreglar en
  `infrastructure`; el ancla en un `.md` con el defecto en un guard de dominio;
  un defecto en dos capas bajo una línea; el Motor que generó tocando solo los
  tests del ancla; en nucleo, anclas en definiciones reemplazadas de migraciones
  append-only y en la línea del registro cuando el fix va en la cabecera.

### 1.4 El daño medido: 61,87 $ en tres anclas donde el fix no cabía

| Ancla | Propuestas | Analista | Generador | OMEGA | Total |
|---|---|---|---|---|---|
| `run-genesis.ts:32` (FORTRESS, 23-ago → 14-sep) | 16 | 16 × 24,04 $ | 16 × 24,06 $ | 5 × 1,61 $ | 49,71 $ |
| migración `…071115.sql:39` (mailbd, 19-ago) | 12 | 5 × 3,79 $ | 4 × 3,98 $ | 4 × 3,16 $ | 10,94 $ |
| `public/_headers:1` (mailbd, 19-ago) | 2 | 2 × 1,22 $ | 0 | 0 | 1,22 $ |

En `run-genesis.ts:32` el análisis decía por escrito que el ancla no necesitaba
cambios, que el arreglo iba en infraestructura y persistencia, y que elegir el
camino pedía un ADR humano. El Motor generó igual: OMEGA vetó cinco veces («el
diff solo añade tests»), el gate falló cuatro, dos timeouts, dos sin diff, dos
sin turnos. Ninguna de las 16 fue un reintento (`retry_of`): fueron 16
ELECCIONES nuevas de C1 en ocho sesiones. La pausa de `hasBlockingRejection`
existe y funcionó como está escrita: se levanta con cada HEAD nuevo, y en
FORTRESS el HEAD se mueve cada día. En mailbd el generador quiso tocar otra
migración y `PreOrderForm.tsx`, y el veto de correa llegó cuatro veces después
de generar. Los dos casos de mailbd son anteriores a la doctrina de los dos
mundos; el de FORTRESS es del mundo del Motor.

### 1.5 Lo que la medición descarta

- **Persistir «dónde se arregla» en el hallazgo y mostrarlo al operador**: sin
  daño medido. El Terminal no lleva correa y arregla donde encuentra; las
  observaciones de nucleo las escribieron agentes que leyeron el código y
  hallaron el sitio igual; no hay rastro de un operador yendo al sitio
  equivocado, porque eso no se registra. Es infraestructura sin consumidor,
  como la relación «mismo defecto» del corte 2 (ADR-101 §6). Se anota.
- **Cambiar la extinción para buscar el marcador en el fichero del arreglo**:
  44 cierres por `juicio_obsoleto` funcionaron con el ancla; el único MITIGATED
  sin prueba (`claude-account.ts:52`, marcador en `send-message.ts`) fue un
  acierto de la regla conservadora: el análisis siguiente dijo REAL con un fix de
  cuatro ficheros. No se toca.
- **Ensanchar la correa al fichero del arreglo**: es un path escrito por un
  agente que leyó el repo auditado (P16), exactamente lo que ADR-012 dejó fuera.
  Si un día se quiere, es por terreno declarado (`.fortress/config`) o con
  aprobación del operador, en ADR propio. Aquí no.

## 2. DECISIÓN 1 — La clave `arreglo` en el análisis

El formato pide, con `status` REAL, una clave más, estructurada:

```
"arreglo": {"file": "ruta relativa al repo", "line": número o null}
```

Es el fichero donde VA el cambio principal. Si el arreglo va en el fichero del
ancla, el analista repite el ancla. `where` sigue siendo prosa y sigue
alimentando las pistas de la correa como hoy: la clave no lo sustituye, lo
vuelve legible por una máquina en el único punto que importa.

- `Analysis` gana `arreglo?: { file, line }`. Se lee con `leerArreglo` en el
  parser, al lado de `leerMismoDefecto`: un objeto con `file` cadena no vacía y
  `line` entero o null; cualquier otra forma es «no dijo». Se persiste gratis en
  el Libro (`evidenceJson`) y `loadAnalysis` lo devuelve tal cual.
- **Si falta** (analista que no contesta, o análisis anteriores a este ADR): se
  genera como hoy. El guard es un freno de gasto, no una defensa: el veto de
  correa sigue detrás del diff. Se cuenta cuántas veces falta (evidencia del
  Libro) y se revisa con dato. Casilla 1.

## 3. DECISIÓN 2 — El guard antes del generador

En `prepareWorktree`, una vez calculadas la correa (`allowed`) y el terreno
declarado (`allows`) y antes de que arranque el generador:

```
si analysis.arreglo existe y NO permitido(arreglo.file, allowed, allows)
  → fail('arreglo_fuera_de_correa', { arreglo, allowed, allows, cfg }, keep=false)
```

- `permitido` es la misma función que juzga el diff después (`scope-check.ts`):
  el guard aplica la regla de hoy antes, no una regla nueva.
- El motivo `arreglo_fuera_de_correa` entra en `REJECTION_REASONS` con sufijo
  `: <fichero> cfg=<hash>`, donde `cfg` es un hash corto del contenido de
  `.fortress/config` en ese árbol, o `none` si no existe. **No** entra en
  `RETRYABLE_REJECTION_REASONS`: repetir no cambia la correa. En la tabla de
  casillas del parte va a `porEntornoDelProyecto`: lo que el operador puede
  hacer es declarar terreno en su proyecto o llevarlo al Terminal, no «mirar el
  diff», porque no hay diff. Casilla 3.
- El worktree se creó antes (la correa se lee de él) y se limpia: no hay nada
  que autopsiar, porque nunca llegó a correr nada.
- Evidencia en el Libro: el arreglo declarado, la correa y el terreno con los que
  no cuadró. Es lo que un humano necesita para decidir entre las tres salidas:
  declarar terreno, arreglarlo en el Terminal, o reanclar el hallazgo.

## 4. La pausa sobrevive al HEAD

`hasBlockingRejection` pausa un hallazgo cuya última propuesta murió por causa
no reintentable, y la levanta con cada HEAD nuevo. Para esta causa eso no
basta: el HEAD de FORTRESS cambia a diario y la correa no. El guard ahorraría el
generador y OMEGA, pero el analista volvería a cobrar en cada sesión: en
`run-genesis.ts:32` son 24,04 $ de 49,71 $.

Por eso esta causa se levanta por su propio hecho, no por el HEAD: el hallazgo
sigue en pausa mientras el `cfg` del motivo coincida con el hash actual de
`.fortress/config` del proyecto. Cambia el terreno declarado → vuelve a la
baraja. Muere el hallazgo o cambia su identidad → es otra fila. El camino
dirigido (`dirigirA`) no pasa por la cola ni por su filtro, como hoy: un
operador que lo pide a mano está pidiendo un fix para su firma, y paga
sabiéndolo. Casilla 2.

Con las dos piezas, en `run-genesis.ts:32` el gasto habría sido un análisis y
ningún generador: alrededor de 1,50 $ en vez de 49,71 $.

## 5. Lo que NO está en este ADR

- La columna «dónde se arregla» en `findings` y la vista «declara / arregla»
  (§1.5): anotadas hasta que aparezca quien las lea.
- La extinción por el fichero del arreglo (§1.5).
- Ensanchar la correa al arreglo (§1.5): ADR-012 sigue tal cual.
- El patrón A, «línea que ya no es»: pieza de identidad y reanclaje, aparte.
- El Terminal: no lleva correa, no lleva guard, no cambia.
- Partir un hallazgo que empaqueta dos defectos: del escáner (ADR-101 formato,
  «trata el del ancla»).

## 6. Consecuencias

- **Positivas**: el Motor deja de pagar por generar lo que el análisis ya dice
  que no cabe (61,87 $ medidos, 49,71 $ en el mundo del Motor); el «no» llega
  antes y dice por qué, con la correa y el terreno a la vista; el operador tiene
  en el parte una casilla que le pide una acción concreta; el hallazgo no vuelve
  a la baraja hasta que el terreno cambie.
- **Negativas**: un campo más en la respuesta del analista; un motivo más en el
  vocabulario y en la tabla exhaustiva del parte; `hasBlockingRejection` gana una
  regla que lee un hash del sufijo del motivo; un analista que declare mal el
  arreglo (fichero que sí cabía) pausa un hallazgo reparable hasta que alguien
  toque `.fortress/config` o lo dirija a mano.
- **Neutras**: la correa, el veto post-diff, la identidad, la extinción, la UI y
  el Terminal no cambian. Los análisis ya asentados sin `arreglo` se generan
  como hasta hoy.

## 7. Alternativas consideradas

- **Ensanchar la correa al fichero del arreglo**: descartada, §1.5 (P16, ADR-012).
- **Leer el sitio del arreglo de la prosa del `where`** con `extractPathHints`:
  descartada; 95 de 171 no empiezan por un path y la prosa nombra también lo que
  «hay que mirar» sin ser el sitio del arreglo. Un contrato no se adivina.
- **Columna en el hallazgo más vista para el operador**: aplazada, §1.5.
- **Reanclar el hallazgo al fichero del arreglo**: descartada; el ancla es donde
  se declara y es la identidad (ADR-084). Declarar y arreglar son dos hechos.
- **Solo el guard, sin pausa por terreno**: descartada por dato, §4: ahorra la
  mitad y deja al analista cobrando cada sesión.
- **Fail-closed cuando falta la clave**: descartada por ahora, §2: bloquearía
  toda generación por una omisión del analista sin ganar seguridad, porque el
  veto de correa sigue detrás del diff. Se cuenta y se revisa. Casilla 1.

## 8. Referencias

ADR-012, ADR-028, ADR-067, ADR-084, ADR-090, ADR-101 ·
`src/domain/repair/allowed-files.ts`, `scope-check.ts`, `scope-groups.ts`,
`repair-rejection.ts`, `retry-eligibility.ts`, `clasificacion-de-baja.ts`,
`bloqueo-por-rechazo.ts`, `analysis.ts`, `analysis-prompt-formato.ts` ·
`src/application/repair/generate-setup.ts`, `generate-fail.ts`,
`elegir-objetivo.ts`, `load-analysis.ts` · `src/infrastructure/repair/parse-analysis.ts`
· `src/infrastructure/project/fortress-config.ts` · medición del 2026-09-23
(memoria del operador, `fortress-ancla-vs-arreglo-medido`).

## 9. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta.

1. **La clave `arreglo`** es obligatoria en el formato con `status` REAL; si
   falta, se genera como hoy y se cuenta: [ ] sí · [ ] fail-closed: sin
   `arreglo` no se genera · [ ] otra: ________
2. **La pausa sobrevive al HEAD**: `arreglo_fuera_de_correa` pausa el hallazgo
   mientras `.fortress/config` no cambie: [ ] sí · [ ] solo el mismo HEAD, como
   el resto de causas · [ ] otra: ________
3. **Casilla del parte**: `porEntornoDelProyecto`: [ ] sí · [ ] `porCorrea` ·
   [ ] casilla nueva: ________
4. **El arreglo NO ensancha la correa**; ADR-012 queda intacto: [ ] sí
5. **He leído §1.5**: la columna y la vista «declara / arregla» quedan anotadas,
   la extinción no se toca: [ ]
6. **El patrón A** («línea que ya no es») es pieza de identidad aparte, no de
   este ADR: [ ]

**Firma del operador:** ________ · **Fecha:** ________
