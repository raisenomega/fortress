# ADR-116 — El lazo autónomo CTO↔Terminal (Sello 2b)

- **Fecha:** 2026-10-13 (documenta lo construido y firmado: 2b-a `359b940`, 2b-b
  `1ee8bce`, 2b-c `3b091f0`; medido sobre `main@6bb389b`)
- **Estado:** Aceptada. El código está en main y firmado pieza a pieza por el
  operador; este ADR fija la decisión y, sobre todo, las alternativas que no se
  reconstruyen del código.
- **Área:** Lazo autónomo · Modo CTO · Terminal
- **Relación:** se apoya en la RED DE REVERSIÓN (ADR-079) y en el cierre de ciclo
  del Terminal (ADR-088); es OTRO lazo que el del Motor (ADR-110) y el de Génesis.

## 1. Contexto

FORTRESS ya reparaba un hallazgo por turno cuando el operador lo mandaba a
«Resolver en Terminal». Pero drenar un proyecto —decenas de hallazgos— exigía al
humano empujar cada vuelta: elegir el siguiente, pegar el encargo, leer el
resultado, repetir. El trabajo real (el fix dentro de la caja) ya era autónomo;
lo que faltaba era que el **ciclo** lo fuera, sin un humano en cada vuelta.

La app ya tenía dos vistas con roles distintos: **construir** (planificar) y
**chat** (ejecutar). El Sello 2b las convierte en los dos extremos de un lazo:

- **CTO** (vista construir): el estratega. Decide QUÉ atacar y en qué orden, y
  emite el encargo como un `PASO:[…]:END-PASO`. Es un razonador: sin herramientas
  de edición; un dato externo lo pide MEDIR al Terminal.
- **Terminal** (vista chat): el ejecutor disciplinado. Tiene la capacidad entera
  de Claude Code y la red de reversión (ADR-079); recibe el PASO con el hallazgo
  en foco, repara, y cierra su ciclo (ADR-088).

## 2. Decisión

Un lazo de cuatro tiempos, todo en el renderer (estado efímero de UI; no
sobrevive a un reinicio de la app, a propósito: es una actividad de sesión):

1. **El CTO propone** un `PASO` (2b-a, `359b940`): un extractor detecta el bloque
   `PASO:…:END-PASO` en la salida del CTO.
2. **Auto-salto** al Terminal tras una **ventana cancelable de 5 s**
   (`ESPERA_DEL_SALTO_MS = 5000`, `salto-store`): salta a la vista chat, **enfoca
   la cabeza de la cola** (fija el `findingId` del turno → OMEGA + verify, ADR-088)
   y envía el PASO.
3. **El Terminal repara** y, al cerrar el turno, **auto-reporta** de vuelta al CTO
   (2b-b, `1ee8bce`) con otra ventana de 5 s: `vuelta()` suma una iteración, el
   `lazo-engine` reengancha al CTO con el resultado.
4. **Siguiente**: el CTO propone el siguiente PASO y el ciclo repite.

El estado vive en `lazo-store` (zustand): `activo`, `iteraciones`, `sinAvanzar`,
`cola` (snapshot congelado, severity-first). Ficheros: `auto-salto-del-cto.ts`,
`auto-reporte-del-terminal.ts`, `empujon-del-cto.ts`, `lazo-trabajo.ts`,
`salto-store.ts`, `lazo-store.ts`, y la decisión en `domain/system/lazo-decision.ts`.

### Paradas y el empujón (2b-c, `3b091f0`)

`lazoStop` (`lazo-decision.ts`, molde de `genesisStop`) es el ÚNICO sitio que
decide parar; **el orden ES la prioridad de seguridad** —la intervención humana y
los topes mandan sobre seguir—:

1. `detenido` — el humano intervino (Detener / toggle). Manda sobre todo.
2. `tope-diario` — el gasto del día, alcanzado (lo cobra el gate del envío).
3. `tope-vueltas` — `iteraciones >= maxIteraciones` (`MAX_VUELTAS_DEFECTO = 8`;
   hacerlo configurable toca el repo de settings FIRMADO → FRONTERA aparte).
4. `nada-que-hacer` — no quedan hallazgos vivos, O el lazo está **estancado**.

El **empújon** es un transitorio, no una parada: un turno que no deja PASO (o un
rechazo / descartado / expirado) NO detiene el lazo; se **empuja** al CTO una vez
(`MAX_SIN_AVANZAR = 1`) para que proponga el siguiente. El «idle» es
**determinista**, no por reloj: se mide en turnos sin avanzar (`sinAvanzar`), no
en segundos —un turno largo legítimo no es idle; un CTO que no propone, sí—. Si
tras el empujón el CTO sigue sin PASO, `nadaQueHacerAhora` devuelve true y el lazo
para limpio (no se badgea en bucle).

## 3. Alternativas consideradas

- **(a) Manual total** (el operador conduce cada vuelta). Descartada: es justo el
  coste que el Sello 2b elimina; no escala a un drenaje de decenas de hallazgos.
  El trabajo ya era autónomo dentro del turno; el cuello era el ciclo.
- **(b) Un solo agente sin separación CTO/Terminal** (uno que estrategia Y
  ejecuta). Descartada: funde dos juicios que conviene separar —QUÉ reparar y en
  qué orden (y cuándo NO hay nada que hacer) vs. el fix dentro de la caja—, y
  pierde que el Terminal tenga la capacidad entera + la red de reversión mientras
  el CTO es un razonador puro. La separación además REUSA las dos vistas que el
  operador ya tenía (construir/chat), no inventa una pantalla nueva.
- **(c) Idle por reloj (timeout)**. Descartada en 2b-c: un turno largo legítimo no
  es inactividad y un timeout lo mataría por error. El estancamiento se mide por
  turnos sin PASO (determinista) — caza al CTO que da vueltas sin avanzar sin
  castigar al Terminal que trabaja.
- **(d) El empújon DETIENE ante cualquier transitorio** (no-PASO, rechazo,
  descartado, expirado). Descartada: un transitorio no es el fin del trabajo; se
  pasa al siguiente. Solo el estancamiento sostenido (`MAX_SIN_AVANZAR`) para.

## 4. Consecuencias

- Habilita la **reparación autónoma de un proyecto** sin humano en cada vuelta.
- **Exige** las guardas de parada como condición de seguridad: sin ellas, un lazo
  autónomo es un proceso que no sabe pararse.
- **La doctrina de firma NO cambia — y es lo central:** el humano sigue en el lazo
  en la FRONTERA DURABLE. El lazo repara y aterriza LOCAL (commit durable por
  turno — el aterrizaje del lazo, A-1→A-5), pero **nunca hace PROTEGER ni push**, y **nunca abre
  el candado del push** —eso lo abre caer los CRITICAL, y pushear es la firma / el
  botón del operador—. El lazo acelera el trabajo; no cruza la frontera.
- Es efímero (renderer): un reinicio de la app lo apaga. Reanudarlo es un acto
  deliberado del operador, no un estado que se arrastra solo.

## Referencias

- [ADR-079](adr-079-editar-el-arbol-vivo-exige-red-de-reversion.md) — la red bajo cada turno del
  Terminal, de la que el lazo depende para editar con vuelta atrás.
- [ADR-088](adr-088-terminal-grado-bancario.md) — el cierre de ciclo del Terminal
  (foco, OMEGA, verify) que cada vuelta del lazo ejecuta.
