# ADR-103 — La severidad de las familias de auditoría: los ejes de seguridad no juzgan lo que no es de seguridad

- **Estado**: Aceptada (firmada por el operador el 2026-09-23)
- **Fecha**: 2026-09-23
- **Alcance**: dos piezas. (1) La derivación de severidad por ejes (ADR-080) **no
  se aplica** a los seis tipos de auditoría de ADR-100: para ellos manda la banda
  que dijo el modelo, el contrato le dice que no ponga ejes, y el hallazgo se marca
  «ejes no aplican», aparte del `sinEjes` que mide la calibración. (2) Un **lote**
  sobre la base viva que restaura la palabra del modelo en las 48 filas vivas de
  esas familias cuya banda la inventó la tabla, con el patrón seguro: backup con
  nombre, ensayo sobre copia, plan impreso, parada, ejecución del operador,
  verificación. **No toca** la tabla de ADR-080 para los tipos de seguridad, ni la
  identidad, ni el score, ni el push, ni la UI.
- **Relación**: **corrige la premisa de ADR-100 §4(a)** («accesibilidad queda
  `sinEjes` y manda la palabra del modelo»), que la medición desmiente · **afina
  ADR-080 §4** («sin ejes no se inventa nada»): los ejes de seguridad no se piden
  para lo que no es de seguridad · deja anotados los ejes por familia como arco
  propio · el lote sigue el patrón de ADR-100 §5 y ADR-101 §5.
- **Nace de**: la medición del 2026-09-23 sobre `main@f7dbc74` y la base viva en
  solo lectura, pieza «severidad por familia» del arco #3 del ROADMAP.

---

## 1. Contexto

### 1.1 Cómo se deriva la severidad hoy

El escáner devuelve su propia `severity` y tres ejes: `alcance`, `efecto` y
`estado` (`report-contract.ts:43-52`). `leerEjes` los valida contra el
vocabulario cerrado y `bandaDe` (`severidad-derivada.ts:26-33`) aplica la tabla
de ADR-080: `defensa-en-profundidad` → LOW, `requiere-condicion` → MEDIUM,
`explotable-hoy` desde `anonimo` o `autenticado` con un efecto que cruza el
perímetro → CRITICAL, cualquier otro `explotable-hoy` → HIGH. La banda derivada
manda; la del modelo se conserva como `severidadDelModelo` y la discrepancia se
asienta en una nota por escaneo en el Libro (`asentar-severidad.ts`). Sin ejes,
el hallazgo se marca `sinEjes` y conserva la palabra del modelo. Los ejes **no se
persisten** en `findings`: lo único que queda es esa nota.

### 1.2 La premisa de ADR-100 §4 era falsa

ADR-100 §4(a) dio por hecho que un defecto de accesibilidad «no tiene efecto en
esa escala: queda `sinEjes` y manda la palabra del modelo». Medido en las 12
notas de escaneo del 7 al 21 de septiembre: **cero hallazgos sin ejes**. El
contrato exige «ELIGE uno» para cada eje sin excepción por tipo, así que el
modelo inventa ejes de seguridad para un contraste o un label sin asociar, y la
tabla de seguridad decide la banda de algo que no es de seguridad. No es «el
modelo juzga sin ejes»; es «la tabla juzga con ejes inventados».

### 1.3 La incoherencia es estructural, con dato

De las 37 accesibilidad vivas, en 29 la banda difiere de la palabra del modelo:
24 subieron (MEDIUM → HIGH 12, LOW → HIGH 9, LOW → MEDIUM 3) y 5 bajaron. El
efecto elegido fue `disponibilidad` en 23 de las 29 y el estado `explotable-hoy`
en 21. El mismo contraste 4,08:1 es HIGH en Raisen Omega (`anonimo ·
disponibilidad · explotable-hoy`) y LOW en FORTRESS (`local · informacion ·
defensa-en-profundidad`); la palabra del modelo era LOW y MEDIUM. Un borde a
1,16:1 es HIGH y un token a 4,08:1 es LOW. Un modal sin gestión de foco es HIGH
en Health Flow y en nucleo y LOW en FORTRESS. Lo que decide la banda es una
elección de `estado` y `alcance` que no significa nada para accesibilidad. En
privacidad, «el consentimiento enlaza a páginas inexistentes» pasó de MEDIUM a
CRITICAL por `anonimo · datos-de-terceros · explotable-hoy`: el único CRITICAL de
familia en la base. En las otras cuatro familias, 11 discrepancias, mixtas.

### 1.4 El daño, medido

- **Priorización, hoy.** La lista ordena por severidad (`BY_URGENCY`) y los chips
  cuentan por severidad. Los HIGH de familia son el 19 % de los HIGH de Health
  Flow, el 27 % en Omega y en nucleo, el 40 % en FORTRESS: un label sin asociar se
  pinta por encima de un MEDIUM de seguridad.
- **Motor, hoy.** El estreno admite LOW y MEDIUM (`debut.ts`); los 4
  accesibilidad HIGH de FORTRESS quedan fuera por una banda que no es suya.
- **Score, latente.** Siete proyectos están en 0 con o sin las familias, y APT BY
  en 27 en los dos casos; las familias pesan 117, 123, 87 y 44 puntos en Health
  Flow, Omega, nucleo y FORTRESS, que contarán cuando suban del suelo.
- **Push, latente.** Cualquier CRITICAL abierto bloquea (`push-project.ts`); el
  CRITICAL de privacidad convive con 3 de seguridad, así que hoy no cambia nada.
  Una decisión de push registrada en toda la base.

### 1.5 Lo que la medición descarta

- **Ejes por familia** (una escala WCAG A/AA/AAA para accesibilidad, clase de
  dato por exposición para privacidad): solo dos de las seis familias tienen
  escala medible; las otras cuatro son juicio. Es ADR propio, y hoy no aporta
  ejes reales a cuatro familias. Queda anotado.
- **Dejar la palabra del modelo tal cual**: no es lo que pasa hoy. Hoy manda la
  tabla de seguridad sobre defectos que no son de seguridad.

## 2. DECISIÓN 1 — La derivación no se aplica a las familias de auditoría

Para los seis tipos de `DEFECTOS_DE_AUDITORIA` (`accesibilidad`, `privacidad`,
`integridad-de-negocio`, `continuidad-y-backups`, `dependencia-vulnerable`,
`criptografia-debil`) la severidad que manda es la que dijo el modelo. Tres
cambios, todos en el escáner:

- **El parser** (`parse-scan-output.ts:39`): el tipo ya está resuelto cuando se
  llama a `conSeveridadDerivada`; si el tipo es de auditoría, no se deriva. La
  fila se marca `ejesNoAplican: true` y **no** `sinEjes`: `sinEjes` mide si el
  modelo se saltó unos ejes que sí aplicaban, y mezclar los dos ensuciaría la
  calibración de ADR-080 §5. Los ejes que el modelo mande de más se ignoran: la
  excepción es de FORTRESS, no depende de que el modelo obedezca.
- **El contrato** (`report-contract.ts`): una línea que diga que para esos seis
  tipos los ejes no se ponen y la `severity` propia es la que manda, juzgada por
  lo que el defecto es. Casilla 2 decide si además se le da una guía de una
  línea para las dos familias con escala (accesibilidad: nivel WCAG y si la tarea
  queda bloqueada; privacidad: clase de dato y a quién se expone).
- **La nota del escaneo** (`asentar-severidad.ts`): cuenta aparte «N de
  auditoría con su palabra», para que el «sin ejes» siga midiendo lo que medía.

Los tipos de seguridad no cambian: misma tabla, misma banda. `otro` tampoco:
sigue derivándose si trae ejes, como hoy.

## 3. DECISIÓN 2 — El lote que restaura la palabra del modelo

La palabra del modelo de las filas afectadas **ya existe**: está en la evidencia
de las notas «Severidad por ejes» del Libro, como `fichero:línea MODELO→BANDA
(ejes)`. El lote no re-juzga nada: lee, cuadra y restaura.

- **Alcance medido**: 48 filas, todas `open/ACTIVE`, en cuatro proyectos (Health
  Flow 14, Omega 16, nucleo 10, FORTRESS 8); por tipo, accesibilidad 29,
  privacidad 8, integridad de negocio 3, continuidad 3, dependencia 3,
  criptografía 2. **No es solo bajar**: 36 bajan (HIGH → MEDIUM 13, HIGH → LOW 9,
  MEDIUM → LOW 13, y el CRITICAL de privacidad que vuelve a MEDIUM) y 12 suben
  (LOW → MEDIUM 7, MEDIUM → HIGH 4, LOW → HIGH 1). Se restaura el juicio del
  modelo, no una dirección. *(Errata corregida el 2026-09-23 tras el ensayo: el
  texto firmado decía «35 bajan y 13 suben, más el CRITICAL»; la suma medida es
  36 y 12, y la decisión de la casilla 3 no cambia.)*
- **Cuadre, fail-closed**: por proyecto se usa la nota **más reciente**; una fila
  entra solo si su tipo es de auditoría, no está EXTINCT, su `fichero:línea`
  tiene entrada en la nota y **la banda de la entrada es igual a la severidad
  actual de la fila** (así una fila tocada después no se pisa). Dos entradas
  del mismo sitio con palabras distintas → la fila no entra y se lista. Medido:
  0 ambiguas, 0 conflictos entre notas.
- **Qué escribe**: `severity` y el `fingerprint` recalculado (lleva la
  severidad, `finding-fingerprint.ts:18`); nada más. Ni identidad, ni tipo, ni
  `first_seen`, ni lifecycle. Idempotente: la segunda pasada escribe 0.
- **Patrón seguro** (ADR-100 §5): `severidad:plan -- <proyecto> [--base]`
  imprime el plan sin escribir; `severidad:aplicar -- <proyecto> --base <ruta>`
  exige `--base` explícita y la app cerrada, cuadra plan contra base y aplica en
  una transacción. Backup con nombre antes, ensayo sobre copia, plan impreso,
  **parada**: la viva la ejecuta el operador, y se verifica fila a fila contra
  el backup y contra la copia del ensayo.
- **Las 37 filas de familia sin discrepancia** (modelo igual a banda) no se
  tocan: ya llevan la palabra del modelo. Un escaneo posterior las refresca con
  la regla nueva, que da lo mismo.

## 4. Lo que NO está en este ADR

- Los ejes por familia (§1.5): anotados hasta que un proyecto suba del suelo o un
  CRITICAL de familia bloquee un push por sí solo.
- La tabla de ADR-080 para seguridad: intacta.
- El score, el push, el estreno del Motor, la UI: leen la severidad que haya, no
  cambian.
- La fusión (`severidadDeLaSuperviviente`, la mayor gana): intacta.
- Las filas EXTINCT de familia con banda inventada: historia, no se reescriben.

## 5. Consecuencias

- **Positivas**: las familias de auditoría dejan de pasar por una tabla que no
  las describe; la misma clase de defecto deja de salir HIGH y LOW según los
  ejes inventados esa vez; 22 accesibilidad HIGH vuelven a MEDIUM o LOW y los
  4 de FORTRESS entran en el rango del Motor; el único CRITICAL de familia
  vuelve al MEDIUM que el modelo dijo; la calibración de ADR-080 deja de
  contar ruido; la premisa de ADR-100 §4 pasa a ser verdad.
- **Negativas**: para seis tipos la severidad vuelve a ser juicio del modelo sin
  regla, que es lo que ADR-080 quiso evitar para seguridad; sin escala escrita
  dos escaneos pueden dar bandas distintas al mismo contraste (la guía de la
  casilla 2 lo amortigua, no lo elimina); 13 filas suben de banda al restaurar.
- **Neutras**: identidad, tipo, alias, hermanos y memoria del escáner no cambian.

## 6. Alternativas consideradas

- **Ejes por familia** (§1.5): aplazada, ADR propio.
- **Pedir los ejes igualmente y descartarlos en FORTRESS**: peor; deja al
  modelo inventando y guarda ruido en la nota de calibración.
- **Re-juzgar las 48 con el escáner**: innecesario y caro; la palabra del modelo
  ya está escrita en el Libro.
- **Restaurar también las EXTINCT**: historia sin consumidor.
- **Marcar las de auditoría como `sinEjes`**: descartada, §2: mezclaría dos
  medidas distintas.

## 7. Referencias

ADR-080, ADR-100 §4 y §5, ADR-101 §5 · `src/domain/scan/report-contract.ts`,
`parse-scan-output.ts`, `hallazgo-con-ejes.ts`, `severidad-derivada.ts`,
`ejes-de-severidad.ts`, `detected-finding.ts`, `defectos-de-auditoria.ts` ·
`src/application/scan/asentar-severidad.ts` · `src/domain/project/finding-fingerprint.ts`
· `src/domain/repair/debut.ts`, `src/application/push/push-project.ts` ·
medición del 2026-09-23 (memoria del operador, `fortress-severidad-por-familia-medida`).

## 8. Casillas de firma

Firmar este ADR es decidir esto. Ninguna casilla la **decide** quien redacta: las
marcó el 2026-09-23 por orden del operador, con su línea literal:

> *«YO Jojo dueño del proyecto FORTRESS firmo ADR-103: casilla 1 sí (la derivación
> no aplica a los seis tipos, ejesNoAplican aparte de sinEjes), casilla 2 sí (la
> guía WCAG y clase-de-dato como orientación, no derivación), casilla 3 sí (el
> lote restaura en las dos direcciones, con parada), casilla 4 sí (las 37 sin
> discrepancia y las EXTINCT no se tocan), casilla 5 leído §1.5, casilla 6 leído
> §1.2 — Jojo, 23 septiembre 2026»*

1. **La derivación no se aplica a los seis tipos de auditoría**; manda la palabra
   del modelo y la fila se marca `ejesNoAplican`, aparte de `sinEjes`: [x] sí ·
   [ ] otra: ________
2. **Guía de una línea en el contrato** para las dos familias con escala
   (accesibilidad: nivel WCAG y tarea bloqueada; privacidad: clase de dato y a
   quién se expone), como orientación y no como derivación: [x] sí · [ ] solo la
   excepción, sin guía
3. **El lote restaura la palabra del modelo en las 48 filas**, en las dos
   direcciones, con el cuadre fail-closed de §3 y parada antes de la viva:
   [x] sí · [ ] solo las que bajan · [ ] otra: ________
4. **Las 37 sin discrepancia y las EXTINCT no se tocan**: [x] sí
5. **He leído §1.5**: los ejes por familia quedan anotados: [x]
6. **He leído §1.2**: la premisa de ADR-100 §4(a) queda corregida por este ADR: [x]

**Firma del operador:** Jojo, dueño del proyecto FORTRESS · **Fecha:** 23 septiembre 2026
