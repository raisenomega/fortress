import { BLOQUE_DE_TIPOS } from './bloque-de-tipos'
import { ALCANCES, EFECTOS } from './ejes-de-severidad'

const lista = (valores: readonly string[]): string => valores.join(', ')

/**
 * Formato en el que todo agente devuelve sus hallazgos. Lo comparten el
 * escaneo y cada paso de un workflow: si cada agente inventara su formato, el
 * informe consolidado no podria juntarlos ni ordenarlos por severidad.
 *
 * Los tres ejes (ADR-080) son lo que decide la banda: el agente reporta
 * hechos de vocabulario cerrado y FORTRESS deriva la severidad. Su propia
 * `severity` sigue viajando, como evidencia de cuanto se calibra.
 *
 * El bloque de tipos y el ejemplo hablan de codigo AJENO (ADR-081). El ejemplo
 * anterior era un defecto interno de FORTRESS emparejado con un tipo que
 * definia otra cosa: ensenaba a forzar justo donde hace falta lo contrario.
 */
export const REPORT_CONTRACT = `Termina SIEMPRE tu respuesta con este bloque, y nada despues:

\`\`\`json
{"findings":[{"severity":"CRITICAL","title":"El checkout cobra el precio que llega en el cuerpo de la peticion","file":"api/checkout.js","line":42,"tipo":"confianza-en-datos-del-cliente","simbolo":"createCheckout","alcance":"anonimo","efecto":"dinero","estado":"explotable-hoy"}]}
\`\`\`

Formato del bloque:
- severity: tu propia banda, exactamente CRITICAL, HIGH, MEDIUM o LOW. Se
  conserva como evidencia; la banda que manda la deriva FORTRESS de los tres
  ejes de abajo.
- title: una frase corta y concreta, sin markdown.
- file: ruta relativa a la raiz del proyecto.
- line: numero de linea, o null si el hallazgo no esta en una linea concreta.
- tipo: no inventes ninguno. ELIGE uno de esta lista POR SU DEFINICION y no
  por su nombre, y elige el mismo que elegirias manana para el mismo defecto:
  es lo que permite reconocerlo entre escaneos.
${BLOQUE_DE_TIPOS}
- simbolo: el nombre de la funcion o bloque que contiene el defecto (por
  ejemplo "createCheckout" o "resolvePrice"), sin parentesis. Cadena vacia si
  el hallazgo no esta dentro de codigo con nombre.
- alcance: quien llega hasta el defecto. ELIGE uno: ${lista(ALCANCES)}.
- efecto: que se lleva o rompe quien lo explota. ELIGE uno: ${lista(EFECTOS)}.
  Los datos de personas son datos-de-terceros, no informacion; informacion es
  lo que no es de nadie (versiones, rutas internas, trazas).
- estado: ELIGE uno. explotable-hoy = funciona con el codigo tal y como esta
  hoy. requiere-condicion = es real pero exige otra falla, una configuracion
  concreta o acceso a la red interna. defensa-en-profundidad = falta una capa
  sin que haya hoy un camino de explotacion (cabeceras, rate limiting, un
  error.message crudo).
- Si no encuentras nada en tu especialidad, el bloque es {"findings":[]}.

\`tipo\` y \`simbolo\` son lo que permite reconocer un mismo defecto entre
escaneos: el titulo se redacta distinto cada vez, esos dos no. Dos defectos
distintos en el mismo archivo deben llevar simbolos distintos.`
