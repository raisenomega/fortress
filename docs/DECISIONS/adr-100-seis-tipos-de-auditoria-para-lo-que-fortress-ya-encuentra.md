# ADR-100 — Seis tipos de auditoría para lo que FORTRESS ya encuentra: accesibilidad, privacidad, integridad de negocio, continuidad, dependencias y criptografía dejan de caer en «otro»

- **Estado**: Aceptada (firmada por el operador el 2026-09-22)
- **Fecha**: 2026-09-22
- **Alcance**: el vocabulario cerrado de tipos de defecto (`src/domain/scan/`) y el
  re-tipado, por juicio, de las filas vivas que hoy están en `otro`. **No toca** los
  módulos de auditoría, el escáner, la UI ni el Historial, ni la regla de severidad.
- **Relación**: aplica el método de **ADR-067** y **ADR-081** (cada tipo lo pide al
  menos una fila real; la definición viaja al prompt) a un tercer corpus · da sitio
  en el contrato a lo que **ADR-083** ya manda buscar · el re-tipado usa **ADR-071**
  (fusión) y **ADR-084** (identidad por línea) con el patrón seguro de la sub-pieza 1
  del arco #3 · es la sub-pieza 3 del arco #3 del ROADMAP, opción 1 de dos.
- **Nace de**: la medición del 2026-09-22 sobre `main@66aa776` y la base viva en
  solo lectura, tras cerrar las sub-piezas 1 y 2.

---

## 1. Contexto

### 1.1 El vocabulario está congelado, y su propio termómetro dice que le falta

`tipo-de-defecto.ts` une dos listas `as const` —15 tipos «de casa» (ADR-067, salidos
de los 34 defectos del propio repo) y 11 «de código ajeno» (ADR-081, derivados de
las filas vivas de mailbd)— con `otro` al final: 27 destinos. Su docblock lo dice:
«Congelado aquí como decisión de producto. Añadir un tipo es cambiar el contrato
del escáner». Cada tipo lleva su definición de una línea como valor, y esa
definición viaja al prompt por `BLOQUE_DE_TIPOS`, con cinco reglas de desempate.
Al parsear, lo que no está en la lista cae a `otro` (`parse-scan-output.ts`).

ADR-081 dejó un termómetro por escaneo (`asentar-vocabulario.ts`): por encima del
15 % de `otro`, «al vocabulario le falta un tipo». Hoy, en la base viva: **108 de
528 vivas son `otro`, el 20 %**. Doce vienen del backfill de la sub-pieza 1; las
otras **96 las eligió el escáner**, tras descartar los otros 26.

### 1.2 FORTRESS ya audita más allá de la seguridad; el contrato no siguió

ADR-083 (2026-09-10), por encargo literal del operador —las plantillas «REFUERZAN
y AMPLÍAN lo que el escaneo ya hace»—, metió en el escaneo los doce módulos del
kit: `prompt-de-parada.ts` lee la plantilla de cada módulo que aplica y la pone en
el prompt de la parada. **M9** (accesibilidad, WCAG 2.2 AA: labels, contraste, foco,
`aria-live`, `lang`, objetivo táctil) entra por señal de fichero; **M3** (privacidad
y PII: consentimiento, retención, borrado y exportación, PII en logs, terceros) y
**M8** (integridad de negocio) por declaración del operador o por el juicio. M2, M4
y la criptografía entran por las pasadas. Ninguna plantilla nombra un `tipo`, sus
hallazgos salen por el mismo contrato, y el hallazgo no guarda el módulo: ni campo
en el contrato ni columna en la tabla. Encuentran lo que se les pide, y lo
encontrado no tiene sitio: cae a `otro`.

### 1.3 Qué cae en `otro` (las 96 del escáner, clasificadas título a título)

| tema real | filas | lo que dicen los títulos |
|---|---|---|
| accesibilidad | 37 | labels sin asociar, modales sin `role dialog` ni foco, contraste 4,08:1 y 1,16:1, errores sin `aria-live`, idioma no declarado, botón de 21 px, PDF sin etiquetar, foto decorativa sin alternativa |
| privacidad, PII y PHI | 17 | consentimiento que enlaza a páginas inexistentes, leads sin aviso, PHI a Langfuse y al LLM sin BAA, DTOs clínicos en logs, chats sin borrado ni exportación por titular, Google Fonts recibe la IP |
| integridad de negocio y datos | 9 | el webhook ignora reembolsos, el reembolso no revierte la factura, upsert ciego, precio como Float, borrar un médico borra historias en cascada |
| continuidad y backups | 7 | sin runbook de restauración, RTO y RPO sin definir, RDS sin `deletion_protection`, pg_dump a un PVC inexistente |
| terceros y supply chain | 7 | Next.js, hono, python-jose y extract-zip con avisos sin parchear, node:18 sin soporte, imports sin versión, artefacto sin firmar |
| SDLC, entorno y operaciones | 7 | el `.env` de desarrollo apunta a producción, seeds sobre usuarios reales, migraciones fuera de `prisma migrate`, un rollback que borra `.git`, sin licencia |
| criptografía | 4 | AES-CBC sin autenticar (tres filas), PHI en columnas en claro |
| seguridad sin tipo en la lista | 4 | tokens en cookies legibles por JS, `.env` legible por cualquier usuario local, docs internas servidas desde `public`, prompt injection en la memoria episódica |
| rendimiento y ReDoS | 2 | regex con backtracking cuadrático, scrypt síncrono de 54 ms |
| tipo existente elegido mal | 2 | mailbd, del día de ADR-081 |

Por proyecto: Raisen Omega 34, Health Flow 32, FORTRESS 15, raisen-nucleo 13,
mailbd 2. **Esto no es un linter de calidad**: «calidad de código» son dos títulos.
Es auditoría real —los módulos M9, M3, M8, M2 y M4— sin sitio en el contrato.

## 2. DECISIÓN — Seis tipos, en una tercera lista, cada uno pedido por filas reales

Se añaden **seis tipos**, con el método de ADR-081: existe el que al menos una fila
real pidió, y el número de filas va al lado.

| tipo | filas | definición (viaja al prompt tal cual) |
|---|---|---|
| `accesibilidad` | 37 | una persona con discapacidad no puede completar la misma tarea: sin nombre accesible, sin foco, sin contraste, sin teclado (WCAG 2.2 AA). |
| `privacidad` | 17 | un dato personal de un titular se recoge, guarda, comparte o retiene sin base, sin consentimiento, sin borrado o sin exportacion. |
| `integridad-de-negocio` | 9 | el sistema se contradice a si mismo: un pago, un estado o un saldo queda inconsistente por un camino que no revierte o no valida lo suyo. |
| `continuidad-y-backups` | 7 | lo que sostiene la recuperacion no existe o no se ha probado: sin backup, sin restauracion probada, sin RTO ni RPO. |
| `dependencia-vulnerable` | 7 | una dependencia, runtime o artefacto con vulnerabilidad conocida, sin soporte, sin version fijada o sin firma. |
| `criptografia-debil` | 4 | cifrado o hash que no protege: sin autenticacion, sal fija, algoritmo roto, o dato sensible en claro donde deberia ir cifrado. |

Los seis cierran **81 de 96, el 84 %** de lo que el escáner deja en `otro`.

**Dónde viven**: en una **tercera lista**, `src/domain/scan/defectos-de-auditoria.ts`,
que `tipo-de-defecto.ts` une a las otras dos. Respeta la estructura de dos orígenes
que ya existe —de casa, de código ajeno— añadiendo el tercero: lo que los módulos
de auditoría encuentran. El orden del prompt sigue siendo casa, ajeno, auditoría y
`otro` al final. `BLOQUE_DE_TIPOS` se emite desde `DEFECTOS`, así que las seis
definiciones llegan al prompt sin copiar nada.

**Los desempates nuevos**, en la lista de `desempate-de-tipos.ts`, con la forma
«síntoma -> tipo» de los cinco que hay:

- Dato personal de un titular -> `privacidad`. Un secreto del sistema (clave, token,
  credencial) -> `secreto-sin-redactar`.
- El dato lo manda el cliente y decide dinero, estado o identidad ->
  `confianza-en-datos-del-cliente`. El sistema se contradice a sí mismo (un camino
  no revierte o no valida lo suyo) -> `integridad-de-negocio`.

**Aceptación**: test rojo → arreglo → mutante → gate 5/5. Los tests genéricos del
vocabulario (cerrado, `otro` al final, el contrato enumera todos los tipos con su
definición) cubren la tercera lista sin cambios; el que cuenta 11 tipos ajenos no se
toca porque la lista es otra. Un test nuevo fija que la tercera lista trae seis y
que cada uno tiene su definición; el mutante que quita uno de la lista debe morir
porque el contrato ya no lo enumera.

## 3. Lo que NO entra, y por qué

- **`calidad-de-codigo`**: la base no lo pide —dos títulos en 96—. Un tipo que
  ningún defecto reclamó es la lista genérica que ADR-067 y ADR-081 rechazaron.
- **SDLC, entorno y operaciones** (7): heterogéneo —seeds, migraciones sueltas, un
  rollback, una licencia—; no describe un defecto, describe siete. Espera corpus.
- **Los cuatro de seguridad sin tipo** (cookies legibles por JS, `.env` legible en
  local, docs internas en `public`, prompt injection): son candidatos a la lista de
  seguridad en otro momento, con su propia medición, no a esta sub-pieza.
- **Rendimiento y ReDoS** (2): dos filas no sostienen un tipo todavía.

## 4. Lo que queda APARTE (trabajo futuro, no de este ADR)

- **(a) La severidad por familia.** Los ejes de ADR-080 son de seguridad: alcance
  (anónimo, autenticado, privilegiado, local) y efecto (dinero, datos de terceros,
  credenciales, ejecución, integridad, disponibilidad, información). Un defecto de
  accesibilidad no tiene efecto en esa escala: queda `sinEjes`
  (`hallazgo-con-ejes.ts`) y manda la palabra del modelo, que hoy dice HIGH en 29
  de las 96. Este ADR no lo cambia: una regla de severidad por familia (por
  ejemplo, el nivel WCAG A, AA o AAA para accesibilidad) es arco propio.
- **(b) La opción 2: reposicionar FORTRESS a «audita todo».** Superficies de UI por
  familia, el Motor reparando defectos de accesibilidad con su correa, y cambiar el
  README, que hoy dice «escaneo de seguridad con agentes especializados». Es una
  decisión de producto del operador, aparte de esta.

## 5. El re-tipado seguro: en la misma entrega, antes del primer escaneo nuevo

La identidad es `fichero|línea|tipo` (`finding-identity.ts`) y el sync casa solo
por clave (`finding-writes.ts`). Si el escáner empieza a emitir `accesibilidad`
con las filas viejas aún en `otro`, `f|l|accesibilidad` no encuentra a `f|l|otro`,
inserta una fila nueva, y la vieja sigue viva porque la ausencia no mata (ADR-065,
`ausencia.ts`) y `TOUCH_FINDING` nunca la alcanza: **se duplica el corpus**. Es el
mecanismo que el docblock de `reidentificar-hallazgos.ts` describe palabra por
palabra.

Por eso el re-tipado va **en la misma entrega que el vocabulario y antes del primer
escaneo con él**: las **108** filas vivas en `otro` (96 del escáner y 12 del
backfill) se re-tipan **por juicio, en lote**, con la herramienta del paso B de la
sub-pieza 1: una llamada al agente dentro de la caja por proyecto, el bloque de
tipos con los seis nuevos, y `RECLASIFICAR_FINDING`, que escribe identidad, tipo y
símbolo y **no toca `lifecycle` ni `status`**: re-tipar no reabre ni mata nada. Las
colisiones las resuelve ADR-071 dentro de la misma transacción: en
`encryption.service.ts:7` hay dos filas `otro` (MEDIUM y LOW) que serían ambas
`criptografia-debil`; se funden, sobrevive la más antigua con la severidad máxima.
Lo que el agente deje en `otro` tras descartar los 32 se queda en `otro`, como
hasta hoy.

Con el patrón seguro de la sub-pieza 1, sin aflojar ninguna guarda: app cerrada y
comprobada, **backup** con nombre, **ensayo sobre copia**, **plan impreso fila a
fila**, **parada para que el operador lo lea**, ejecución sobre la viva solo por su
mano, y comparación fila a fila contra el backup. Coste estimado por el paso B
(3,71 dólares por 36 filas): unos 12 dólares.

## 6. Consecuencias

- **Positivas**: el 84 % de `otro` recibe clase e identidad estable; el termómetro
  de ADR-081 baja del 15 % en los proyectos con UI y datos; los hermanos por clase
  de ADR-099 agrupan accesibilidad con accesibilidad y no con todo; lo que M9, M3,
  M8, M2 y M4 encuentran deja de ser invisible en la clasificación.
- **Negativas**: seis tipos más en el prompt (seis líneas); dos desempates más; una
  migración por juicio con su coste; y la severidad de estas familias sigue siendo
  la palabra del modelo hasta el arco (a).
- **Neutras**: la UI y el Historial no cambian (cero usos de `tipo` en
  presentación); el escáner y los módulos no cambian; la regla de severidad no cambia.

## 7. Alternativas consideradas

- **Meter los seis en la lista de código ajeno** — RECHAZADA: mezcla dos corpus y
  rompe la trazabilidad «este tipo lo pidió esta fila de este corpus».
- **Guardar el módulo (M9, M3…) como tipo** — RECHAZADA: el módulo es de la
  parada, no del hallazgo; un mismo módulo produce defectos de familias distintas
  (M3 produce privacidad y también secretos), y el hallazgo no lo guarda hoy.
- **Un tipo `calidad-de-codigo`** — RECHAZADA: ninguna fila lo pide (§3).
- **Ampliar sin re-tipar las 108** — RECHAZADA: duplica el corpus (§5).
- **No hacer nada** — RECHAZADA: una de cada cinco cosas encontradas se queda sin
  clase, y el propio termómetro de ADR-081 lo marca como fallo del vocabulario.

## 8. Referencias

ADR-065, ADR-067, ADR-071, ADR-080, ADR-081, ADR-083, ADR-084, ADR-099 · ROADMAP
§3 «El contrato del hallazgo» · `src/domain/scan/tipo-de-defecto.ts`,
`defectos-de-casa.ts`, `defectos-de-codigo-ajeno.ts`, `bloque-de-tipos.ts`,
`desempate-de-tipos.ts`, `parse-scan-output.ts` · `src/infrastructure/scan/prompt-de-parada.ts`
· `src/infrastructure/persistence/reidentificar-hallazgos.ts`, `finding-fusion-sql.ts`
· medición del 2026-09-22 (memoria del operador, `fortress-tipos-fuera-de-seguridad`).

## 9. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-22 por orden del operador, con su línea literal:

> *«yo jojo dueño del proyecto fortress firmo ADR-100: seis tipos [nombres ok],
> desempates ok, severidad-por-familia y opción-2 aparte, re-tipado con parada en
> el plan, leído — Jojo, 22 septiembre 2026»*

1. **Los seis tipos** (`accesibilidad`, `privacidad`, `integridad-de-negocio`,
   `continuidad-y-backups`, `dependencia-vulnerable`, `criptografia-debil`), en una
   tercera lista `defectos-de-auditoria.ts`: [x] sí, con los nombres tal cual · [ ] otra: ________
2. **Los desempates** de §2 (dato personal -> privacidad / secreto del sistema ->
   secreto-sin-redactar; el cliente manda -> confianza-en-datos-del-cliente / el
   sistema se contradice -> integridad-de-negocio): [x] sí · [ ] otra: ________
3. **Lo que queda aparte**: la severidad por familia y la opción 2 son decisiones
   posteriores, no de este ADR: [x] leído
4. **El re-tipado seguro** de las 108 filas `otro`, por juicio y en la misma
   entrega, con backup, ensayo en copia, plan impreso y **parada antes de la viva**:
   [x] sí · [ ] otra: ________
5. **He leído §1.3 y §3.** [x]

**Firma del operador:** Jojo, dueño del proyecto FORTRESS · **Fecha:** 22 septiembre 2026
