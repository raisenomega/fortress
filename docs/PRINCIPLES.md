# FORTRESS — Principios de método

Cada principio de este documento nació de un error real, verificado con
evidencia, durante la construcción de FORTRESS. No son aspiraciones: son
reglas que ya costaron algo aprender. El documento crece; nunca se borra un
principio (si evoluciona, se marca como revisado).

Formato uniforme: **Contexto** (el error que lo parió) / **Regla** /
**Ejemplo**.

## 1. Verificar todas las formas del input

- **Contexto:** un guard de red que bloqueaba hosts privados cubría el
  literal, pero no las formas equivalentes que el sistema operativo también
  acepta.
- **Regla:** cuando un input puede llegar en múltiples formas (nombre,
  literal, IPv4-mapped, hexadecimal, decimal, octal), verificar TODAS antes
  de dar un fix por completo. La red las procesa por caminos distintos.
- **Ejemplo:** `::ffff:7f00:1` y las formas hex/decimal/octal de
  `127.0.0.1` tenían que cubrirse además del literal.

## 2. No delegar comparaciones críticas a herramientas que fallan suave

- **Contexto:** `git --since` ignora fechas ilegibles en silencio y devuelve
  resultados como si nada.
- **Regla:** cuando una comparación determina flujo del programa, hacerla en
  un lenguaje donde el error sea explícito, no delegarla a una CLI que falla
  suave.
- **Ejemplo:** la comparación de fechas se movió del `git --since` a
  JavaScript, donde `NaN` cae a `false` honesto.

## 3. Probar cada capa de defensa por separado

- **Contexto:** una defensa en capas parecía verificada, pero el test pasaba
  por la capa equivocada.
- **Regla:** cada capa se prueba con un caso que SOLO esa capa puede manejar.
  Un test que pasa por la capa equivocada es un falso verde.
- **Ejemplo:** guard en dominio, guard en el caso de uso y guard en el
  handler: tres tests, cada uno anulando las otras dos capas.

## 4. La telemetría del libro manda sobre los timestamps de UI

- **Contexto:** una corrida parecía haber tardado 44 minutos "misteriosos";
  eran minutos humanos entre dos clics.
- **Regla:** el tiempo de máquina se lee del registro estructurado (duración
  por eslabón), nunca de la distancia entre timestamps de interfaz, que
  mezclan tiempo humano y tiempo de ejecución.
- **Ejemplo:** el libro de vida probó que el gate real tardó 169 segundos;
  el resto era espera humana.

## 5. Matar al padre no basta cuando `npm run X` es el proceso

- **Contexto:** un botón de "Detener" enviaba SIGTERM al padre y el proceso
  seguía vivo: los nietos (tsc, eslint, vitest) sostenían los pipes.
- **Regla:** procesos lanzados como `npm run X` se matan por GRUPO:
  `spawn` con `detached: true`, `process.kill(-pid, SIGTERM)` y escalada a
  SIGKILL a los pocos segundos. Y el timeout se prueba con binarios falsos
  que ignoran SIGTERM, no con mocks.
- **Ejemplo:** el test que atrapó el bug usaba un binario fake que ignoraba
  SIGTERM; el mock jamás lo habría detectado.

## 6. Datos vs metadatos en prompts

- **Contexto:** al blindar prompts contra inyección, la tentación es
  sanitizarlo todo — y eso corrompe justo lo que el agente debe revisar.
- **Regla:** sanitizar METADATOS (títulos, razones, campos que describen el
  objeto); jamás los DATOS (el código, el diff, el objeto en sí). Aplica a
  cualquier agente que reciba una mezcla de ambos.
- **Ejemplo:** el revisor semántico recibe el diff intacto entre
  delimitadores estrictos; los títulos del hallazgo llegan sanitizados.

## 7. La evidencia estructurada separa "no está" de "está pero no se muestra"

- **Contexto:** un dato ausente en pantalla puede ser un bug de motor o un
  bug de UI; sin registro estructurado, el diagnóstico es a ciegas.
- **Regla:** cada paso del motor asienta su evidencia (JSON) en un registro
  consultable. Ante un síntoma en UI, primero se consulta el registro: si la
  evidencia está, el bug es de presentación; si no está, es de motor.
- **Ejemplo:** un veredicto que no aparecía en pantalla estaba completo en
  el libro de vida: el fallo era un refetch con closure obsoleto en la UI.

## 8. Verificar el binario por identificadores, no por nombres de archivo

- **Contexto:** tras un rebuild, el grep del bundle por nombres de archivo
  kebab-case daba vacío y parecía que el código no había entrado.
- **Regla:** el bundler disuelve los nombres de archivo. La verificación
  válida es por identificadores que sobreviven al bundle: funciones,
  constantes, strings literales de canales.
- **Ejemplo:** `grep runOmega` sobre el asar extraído confirma el contenido;
  `grep run-omega.ts` no prueba nada.

## 9. El build que cuenta es el que produce el artefacto completo

- **Contexto:** `npm run build` compilaba pero NO regeneraba el instalable;
  dos veces pareció que un cambio "no había entrado".
- **Regla:** conocer qué comando produce el artefacto de distribución real y
  verificar sobre ese artefacto (asar extraído + comparación binaria entre lo
  construido y lo instalado). El grep directo sobre un AppImage siempre da
  vacío: es un filesystem comprimido.
- **Ejemplo:** el flujo válido es build del instalable, verificación por
  identificadores en el asar y `cmp` entre build e instalado.

## 10. El motor recomputa los veredictos sintéticos

- **Contexto:** un agente revisor devuelve ejes de evaluación y una
  conclusión; confiar en su conclusión literal deja al sistema a merced de
  un desliz del modelo.
- **Regla:** los ejes son evidencia; la conclusión la deriva el motor con
  reglas deterministas. Si difieren, manda el motor y la discrepancia se
  asienta en el registro.
- **Ejemplo:** el veredicto global del revisor semántico se recalcula de sus
  seis ejes; un desacuerdo queda registrado como decisión, no se ignora.

## 11. La cola es de proceso, no persistida

- **Contexto:** un estado RUNNING persistido en base de datos queda huérfano
  si la aplicación se cierra a mitad de la corrida.
- **Regla:** las colas de ejecución viven en memoria de proceso. Lo
  persistido es el estado del objeto, y al arrancar se reclaman los
  huérfanos por umbral de antigüedad.
- **Ejemplo:** al abrir la app, las corridas colgadas se detectan y se
  cierran con autopsia; nada queda "corriendo" para siempre.

## 12. Los estados terminales no se re-abren

- **Contexto:** la tentación de "reintentar" mutando una propuesta rechazada
  destruye la historia de por qué se rechazó.
- **Regla:** los estados finales son finales. Un reintento crea un objeto
  NUEVO con un vínculo de linaje explícito al viejo; el viejo queda intacto
  como historia.
- **Ejemplo:** el reintento del motor crea una propuesta nueva sobre el HEAD
  actual, trazable a la original; la vieja no se toca.

## 13. Sin documentación no hay merge

- **Contexto:** meses de construcción intensa dejaron un sistema potente con
  documentación que no sobreviviría a la pérdida del equipo de trabajo.
- **Regla:** todo incremento entrega su pieza de documentación como parte
  del mismo trabajo. Test aplicable en cada firma: "si perdiera el equipo
  hoy, ¿otro ingeniero puede reconstruir esto desde el repo?".
- **Ejemplo:** esta misma documentación existe porque la regla se activó
  como bloqueo duro: sin fase documental completa, el motor no mergeaba.

## 14. Cuando move + edit rompe la detección de rename, divide en dos commits

- **Contexto:** mover un documento y ampliarlo en el mismo commit bajó la
  similitud del ~50% que git usa como umbral: el rename se degradó a
  delete + create y `git log --follow` dejó de cruzar la historia.
- **Regla:** si la edición es sustancial, dividir: commit 1 = `git mv` puro
  (rename 100% garantizado), commit 2 = la edición. "Un commit atómico por
  tarea" cede ante "preservar historia navegable" — la atomicidad sirve a la
  legibilidad, no al purismo.
- **Ejemplo:** `docs/ARCHITECTURE.md` se movió en un commit puro y se amplió
  en el siguiente; `--follow` cruza hasta el commit que creó el archivo.

## 15. Un patrón transversal se audita por barrido, no por memoria

- **Contexto:** un patrón de manejo de errores (try/catch en cada llamada al
  bridge desde servicios del renderer) se aplicó en tres módulos y se olvidó
  en otros tres: una sola causa raíz, tres bugs.
- **Regla:** cuando se establece un patrón que aplica "en todos los puntos
  X", se hace grep de TODOS los puntos X y se verifica uno a uno. La
  memoria no es herramienta de cobertura.
- **Ejemplo:** el barrido de `await api()` en servicios del renderer reveló
  los tres módulos sin catch; el fix fue uno por módulo, la lección una.

## 16. Lo que redacta un agente y la app escribe a disco es input no confiable

- **Contexto:** al generar documentos de gobierno para un proyecto nuevo, el
  agente propone nombres y contenidos que la aplicación luego escribe en el
  filesystem.
- **Regla:** todo nombre o ruta que venga de un agente se trata igual que
  input de usuario: allowlist de nombres permitidos, guard contra path
  traversal, y capturar del texto PERSISTIDO, nunca del stream efímero.
  Además, un `git commit` programático fija identidad y firma explícitas.
- **Ejemplo:** un nombre arbitrario envuelto por el agente (p. ej.
  `../../.bashrc`) jamás se escribe: solo los documentos de la allowlist.

## 17. Documentar el estado presente y el estado de diseño por separado

- **Contexto:** al documentar la firma del motor, la doctrina del eslabón
  (verificaciones previas, merge `--no-ff`, push humano) se describió como si
  ya viviera integrada en la aplicación, cuando hoy la firma es un merge
  manual del operador en su terminal. Describir el diseño como presente
  miente sobre lo que un ingeniero encontrará al abrir la app.
- **Regla:** documentar cómo quisiéramos que fuera el sistema es diseño;
  documentar cómo es hoy es honestidad. Los dos coexisten y se declaran por
  separado; ninguno oculta al otro. Cada capacidad lleva su estado presente
  explícito cuando difiere del diseño.
- **Ejemplo:** el flujo de auto-reparación describe la doctrina completa de
  la firma Y declara aparte que hoy esa firma es un merge manual del
  operador, con la integración en la app en construcción. La distinción
  entre bucle diseñado y bucle presente se aplica con más fuerza en
  `docs/FLOWS/LOOP-VIEJO.md`; su decisión de fondo es
  `docs/DECISIONS/adr-049-loop-autonomo-pre-motor.md`.

## 18. Al agente no se le cree por fe

- **Contexto:** un agente LLM reporta su propio consumo de tokens, dice qué
  archivos tocó y emite un veredicto. Confiar en esos tres reportes deja al
  sistema a merced de un desliz — o una alucinación — del modelo.
- **Regla:** lo que el agente afirma sobre sí mismo se verifica con una
  fuente dura, no con su palabra. La factura de tokens sale del JSON real de
  la herramienta (y si no se puede leer, queda vacía, no se inventa); los
  archivos tocados los detecta el motor con `git diff`, no el reporte del
  agente; el veredicto global lo recomputa el motor desde los ejes.
- **Ejemplo:** los cuatro actores del motor operan bajo esta regla
  (`docs/AGENTS.md`); Sentinel Omega la lleva al extremo con
  evidencia-o-silencio: sin archivo:línea comprobable, el puntaje es nulo, no
  un número inventado
  (`docs/DECISIONS/adr-046-sentinel-omega-carta-y-noes.md`).

## Sobre este documento

Este archivo crece. Cada principio nuevo se añade con su contexto de origen
y ejemplo. NUNCA se borra un principio; se marca como "revisado" si
evoluciona. La numeración sigue el orden de incorporación al documento (cada
contexto lleva su origen); no implica importancia.

Relacionados: `docs/OVERVIEW.md` (qué es FORTRESS), `docs/ARCHITECTURE.md`
(las reglas duras que varios principios alimentan), `docs/GLOSSARY.md` (los
términos que estos principios usan).
