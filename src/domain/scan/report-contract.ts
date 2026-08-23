import { TIPOS_DE_DEFECTO } from './tipo-de-defecto'

/**
 * Formato en el que todo agente devuelve sus hallazgos. Lo comparten el
 * escaneo y cada paso de un workflow: si cada agente inventara su formato, el
 * informe consolidado no podria juntarlos ni ordenarlos por severidad.
 */
export const REPORT_CONTRACT = `Termina SIEMPRE tu respuesta con este bloque, y nada despues:

\`\`\`json
{"findings":[{"severity":"CRITICAL","title":"API key hardcodeada","file":"src/config.js","line":1,"tipo":"secret-in-env","simbolo":"buildEnv"}]}
\`\`\`

Formato del bloque:
- severity: exactamente CRITICAL, HIGH, MEDIUM o LOW.
- title: una frase corta y concreta, sin markdown.
- file: ruta relativa a la raiz del proyecto.
- line: numero de linea, o null si el hallazgo no esta en una linea concreta.
- tipo: ELIGE uno de esta lista, no inventes ninguno. Si de verdad no encaja,
  pon "otro"; es preferible a forzar un tipo que no es.
${TIPOS_DE_DEFECTO.map((t) => `  · ${t}`).join('\n')}
- simbolo: el nombre de la funcion o bloque que contiene el defecto (por
  ejemplo "handleVerify" o "buildEnv"), sin parentesis. Cadena vacia si el
  hallazgo no esta dentro de codigo con nombre.
- Si no encuentras nada en tu especialidad, el bloque es {"findings":[]}.

\`tipo\` y \`simbolo\` son lo que permite reconocer un mismo defecto entre
escaneos: el titulo se redacta distinto cada vez, esos dos no. Dos defectos
distintos en el mismo archivo deben llevar simbolos distintos.`
