# ADR-112 — El prompt viaja por stdin: el transporte de los agentes no depende del SO

- **Estado**: Aceptada (firmada por el operador el 2026-10-03)
- **Alcance**: los CUATRO constructores de args de agentes —el generador
  (edición y lectura: analista, crítico, OMEGA), el CLI del Terminal/escáner
  (`buildArgs`), `index-graph` y `verify-graph`— dejan de poner el prompt como
  argumento de línea de comandos y lo entregan por **stdin** al proceso
  `claude -p`. Sus spawns escriben el prompt en el stdin del hijo y lo cierran.
- **No toca**: la caja (clase A/B: los mismos flags, el mismo bwrap — stdin la
  cruza), el contenido de ningún prompt, las capacidades (`capacidadesDe` lee
  los flags, no el prompt), ni las políticas de permisos.
- **Nace de**: el `spawn E2BIG` del 2026-10-03 — el expediente de OMEGA con el
  `package-lock.json` (370.544 B ×2) superó el límite POR ARGUMENTO de Linux y
  OMEGA murió antes de nacer, con el drenaje detrás.

## 1. La firma del operador

> «YO Jojo dueño del proyecto FORTRESS firmo: paso el prompt de los agentes
> por STDIN en vez de argv, en los cuatro constructores (el generador
> —edición y lectura—, el CLI del Terminal/escáner, index-graph,
> verify-graph). Razón: el límite de argumentos del SO (Linux 128 KiB por
> argumento, macOS ~1 MiB total, Windows 32 KB total) rompe el prompt — y
> FORTRESS se distribuye a las tres plataformas (build:win con
> forceCodeSigning, build:mac con notarize). En Windows el expediente NORMAL
> (25-50 KB) ni siquiera cabe en 32 KB: los agentes están rotos de serie ahí.
> Stdin no tiene ese límite en ningún SO (verificado en vivo: echo prompt |
> claude -p funciona). Esto es el TRANSPORTE, necesario para que FORTRESS
> funcione en las máquinas de mis clientes, no robustez futura. Aparte y
> después, (a) el CONTENIDO: acotar el lock entero ×2 (~190k tokens de ruido)
> en el prompt de OMEGA con nota legible, porque OMEGA juzga con el diff —
> sigue haciendo falta con stdin, por coste, no por el límite.»

## 2. Los límites, medidos y confirmados (2026-10-03)

| SO | Límite | El expediente del lock (~750 KB) | El NORMAL (25–50 KB) |
| --- | --- | --- | --- |
| Linux | 2 MiB total (`getconf ARG_MAX` = 2.097.152, medido) **+ 131.072 por argumento** (`MAX_ARG_STRLEN`, constante del kernel) | muere — el E2BIG de hoy | pasa |
| macOS | `kern.argmax` = 1.048.576 **total** argv+env | frontera (~770 KB + env) | pasa |
| Windows | `CreateProcess` = 32.767 caracteres **total**; Node `spawn` sin shell pasa por ahí | muere | **muere** |

Tres datos más que fijaron la forma: `claude -p` **lee el prompt de stdin**
cuando no hay positional (verificado en vivo, $0,019, «STDIN-OK»); el prompt
nunca participa de `capacidadesDe` (lee flags), así que separarlo no toca el
contrato «el prompt refleja los args»; y en el expediente de OMEGA los
ficheros van ENTEROS pre+post sin tope (`run-omega-inputs`, verificado), por
lo que el techo lo pone el fichero más gordo del diff — en FORTRESS el lock,
en un repo de CLIENTE (el Terminal usa el MISMO `juzgar`) cualquier fichero.

## 3. La forma

Cada constructor devuelve `{ args, prompt }`: los args llevan `-p` SIN valor
y todos los flags de siempre; el prompt viaja aparte y el spawn lo escribe en
el stdin del hijo y lo **cierra** — sin el cierre, el CLI espera EOF para
siempre. La caja no cambia: bwrap hereda los descriptores y stdin la cruza
(probado con un volcado de 200 KB a través del bwrap real). El mutante de la
clase: devolver el prompt a argv — el test del transporte lo caza midiendo
que el prompt no está en los args y que los args caben en el límite de
Windows con un prompt de 200 KB dentro.

## 4. Lo que esta decisión deja dicho para Windows

Con stdin, el tamaño del prompt deja de pasar por el límite de argumentos en
las tres plataformas. Queda **medido por el límite, no probado en una máquina
Windows real**: la prueba de humo en Windows es del día que se empaquete para
un cliente Windows, y este ADR es su prerequisito, no su sustituto.

## 5. Lo que queda fuera, a propósito

**(a) el CONTENIDO** — acotar el lock entero ×2 en el expediente de OMEGA
(~190k tokens de ruido que el revisor no lee: juzga con el diff). Con stdin
ya no es por el límite: es por dinero y contexto. Anotado en DEUDAS §18 con
la frase de la firma que lo nombra; arco propio.

## Referencias

- **ADR-092** — la caja; stdin no altera ninguna de sus casillas.
- **ADR-111** — la correa que generó el fix cuyo expediente destapó esto.
- `docs/DEUDAS.md` §18 — (a) el contenido, pendiente con su firma.
