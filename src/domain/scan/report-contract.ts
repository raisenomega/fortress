/**
 * Formato en el que todo agente devuelve sus hallazgos. Lo comparten el
 * escaneo y cada paso de un workflow: si cada agente inventara su formato, el
 * informe consolidado no podria juntarlos ni ordenarlos por severidad.
 */
export const REPORT_CONTRACT = `Termina SIEMPRE tu respuesta con este bloque, y nada despues:

\`\`\`json
{"findings":[{"severity":"CRITICAL","title":"API key hardcodeada","file":"src/config.js","line":1}]}
\`\`\`

Formato del bloque:
- severity: exactamente CRITICAL, HIGH, MEDIUM o LOW.
- title: una frase corta y concreta, sin markdown.
- file: ruta relativa a la raiz del proyecto.
- line: numero de linea, o null si el hallazgo no esta en una linea concreta.
- Si no encuentras nada en tu especialidad, el bloque es {"findings":[]}.`
