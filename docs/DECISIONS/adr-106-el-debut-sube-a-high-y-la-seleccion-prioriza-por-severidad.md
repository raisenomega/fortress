# ADR-106 — El debut sube a HIGH, la selección prioriza por severidad, y la puerta de CRITICAL queda condicionada a su prueba

- **Estado**: Aceptada (firmada por el operador el 2026-09-30)
- **Alcance**: `DEBUT` pasa de `['LOW','MEDIUM']` a `['LOW','MEDIUM','HIGH']`
  (`debut.ts`); la severidad entra **primera** en el orden de `selectTarget`
  reusando `compareSeverity`; las cuatro piezas de la selección entran en los
  innegociables. **No toca**: el auto-merge, `loopBlocked`, la correa, el
  tribunal, ni el techo de vueltas del generador. **No sube CRITICAL.**
- **Relación**: continúa **ADR-007** (el debut empezó en LOW y subió a MEDIUM el
  2026-08-08 tras una ejecución auditada) y su doctrina literal: «la confianza se
  gana con evidencia, no se declara». Es la dimensión 2 del arco del Motor del
  ROADMAP; su dimensión 1 y su pieza 1 están en `15b7fbf`.
- **Nace de**: la medición del 2026-09-30 sobre `main@0cf4d16`. El motor **nunca
  había intentado un CRITICAL** —0 de 177 propuestas— y la pregunta era si eso
  era un freno o ausencia de caso. Es un freno: hay **50 CRITICAL abiertos** en 7
  de los 8 proyectos, ninguno con propuesta, y **122 HIGH abiertos** de los que
  solo 4 se intentaron, todos por la vía dirigida.

## 1. La firma del operador

> «YO Jojo dueño del proyecto FORTRESS firmo ADR-XXX: subir DEBUT a incluir HIGH
> ahora; priorizar por severidad en la selección; CRITICAL entra cuando un HIGH
> pase la cadena completa (gate verde + OMEGA + mi firma + merge) con created_at
> posterior a este ADR; la escalera documentada; las cuatro piezas de la
> selección (debut, select-target, orden-candidatos, elegir-objetivo) a
> innegociables; y abrir DEBUT no abre el auto-merge —HIGH sigue exigiendo mi
> firma para integrarse.»

## 2. La confianza acumulada, medida

ADR-007 subió a MEDIUM con **una** ejecución auditada de punta a punta. Lo que
hay hoy en el libro, sobre 1582 eventos:

| Evidencia | Cuenta |
|---|---|
| Corridas del generador que entregaron fix | **62** |
| Gates verdes | **61** |
| Aprobaciones de OMEGA | **51** |
| Integraciones firmadas por el operador | 28 |
| Propuestas trabajadas siendo HIGH | **0** |

**CORRECCIÓN MEDIDA, y hay que leerla antes de firmar.** Al construir este ADR se
dijo que «un HIGH ya recorrió la cadena completa». **Es falso.** La propuesta que
llegó a MERGEADO sobre un hallazgo que HOY es HIGH se trabajó **siendo MEDIUM**:
la evidencia de su propio evento lleva `"severity":"MEDIUM"`, y el analista
escribió en su razón «lo que explica que sea MEDIUM y no CRITICAL». Su severidad
subió después —ADR-103 re-graduó 48 filas el 23-sep—.

Tampoco entró «dirigida»: la vía dirigida nació el 21-ago (`f0a700e`) ya
filtrando por el debut, y esa propuesta es del 19-ago.

**Así que la cadena NUNCA ha procesado un hallazgo que fuera HIGH al trabajarlo.**
Lo que respalda este escalón es el VOLUMEN sobre LOW y MEDIUM —62 fixes, 61
gates, 51 revisiones— y no un HIGH superado. Es una confianza menor que la que
se creyó al proponerlo, y el operador firma sabiéndolo.

## 3. Lo decidido

### 3.1 `DEBUT` incluye HIGH

`DEBUT = ['LOW','MEDIUM','HIGH']`. Es la **única** puerta que decide si un
hallazgo puede TRABAJARSE: medido, la severidad solo vuelve a aparecer en el
texto de la justificación, en `puedeAutoIntegrarse` (solo modo `completo`) y en
la puerta de integración. CRITICAL **sigue fuera**.

### 3.2 La selección prioriza por severidad

`compareSeverity(a.severity, b.severity)` se antepone a la cadena de desempates
de `order()`, que queda **intacta** (superficie, antigüedad, carga de carpeta,
directorio, línea, id). Se reusa la autoridad única de `shared/severity.ts`.

Sin esto, subir la puerta no cambiaría nada observable: el orden es por
SUPERFICIE, así que un HIGH admitido casi nunca saldría elegido. Medido sobre la
cola real (482 candidatos vivos), en los cuatro proyectos con más HIGH el elegido
pasa de un MEDIUM a un HIGH **de la misma superficie (1)**: priorizar por
severidad no empuja al motor a fixes más grandes.

### 3.3 La puerta de CRITICAL, condicionada y VERIFICABLE

CRITICAL entra cuando exista una propuesta con hallazgo **HIGH**, estado
**MERGEADO**, cuyos eventos incluyan `gate verde`, `omega aprobo` e
`integracion firmada por el operador`, y cuyo **`created_at` sea POSTERIOR al
sello de este ADR**.

El corte por `created_at` es imprescindible y no es formalismo: **ya existe un
HIGH con esa firma exacta** (`created_at=1787495660174`, el 19-ago, bajo la
puerta vieja). Sin el corte, la condición nacería cumplida.

La subida será **una línea** (`DEBUT += 'CRITICAL'`) con la firma del operador
cuando la prueba se cumpla. **Este ADR no la hace.**

### 3.4 Las cuatro piezas de la selección, innegociables

`debut.ts`, `select-target.ts`, `orden-candidatos.ts` y `elegir-objetivo.ts`
entran en la lista que gobierna la autonomía. Medido antes de decidirlo: la
puerta de **integración** estaba protegida (`alcance`, `scope-check`,
`firma-limite`, el par de auto-merge) y la de **selección** no. Abrir HIGH deja
**12 HIGH trabajables en el repo propio**, y una defensa que dependa de que
nadie proponga tocarla no sobrevive a un lote.

### 3.5 Las TRES puertas a un objetivo, y cuál filtra

Medido: `selectTarget` filtra por el debut; `dirigirA` **también** —«un clic no
acumula confianza»—; y `elegirParaVerificar` **no filtra**, pero nunca edita:
produce un dictamen, no un fix (`verificar-mitigado.ts` no nombra al generador ni
una vez). Así que subir el debut no deja ninguna puerta sin criterio.

### 3.6 Abrir el debut NO abre el auto-merge

Son dos puertas distintas y se mantienen distintas. `auto-merge-evaluation.ts`
sigue respondiendo «Severidad HIGH: exige firma humana» cuando la política del
proyecto no la lista. El motor **trabaja** el HIGH; integrarlo sigue siendo del
operador.

## 4. Lo que NO cambia

`loopBlocked` (otro eje: el binario vivo), «nunca `origin` sin la firma», el
motor propone y el humano dispone, la correa del generador, el tribunal, el
techo de vueltas, y las 8 defensas que ya bloquean HIGH del repo propio en
**todos** los modos.

## 5. Consecuencias

### Positivas
- El motor ataca lo grave primero, con la misma superficie de cambio.
- La escalera queda escrita con su criterio, no con una fecha.

### Negativas
- Un error del generador sobre un HIGH duele más que sobre un MEDIUM. Lo
  contienen las redes que no se tocan: gate, OMEGA y la firma.

### Neutras
- Los 50 CRITICAL siguen esperando; su puerta ya tiene condición y no opinión.

## Referencias

- **ADR-007** — el debut y su escalera (LOW → MEDIUM).
- **ADR-003** — el otro eje del debut (el repo propio).
- `docs/ROADMAP.md`, arco del Motor: dimensión 1 y pieza 1 (`15b7fbf`).
