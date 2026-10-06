/**
 * Como se decide si el entorno de un spawn esta ACOTADO.
 *
 * Sale del test por dos razones: son dos sujetos —el barrido que encuentra a
 * quien spawnea, y la REGLA que juzga su entorno— y el fichero estaba en 75
 * lineas justas. El nombre lleva `fixture` a proposito: `ES_TEST` lo excluye del
 * barrido, asi que las regex de ejemplo de aqui no cuentan como spawns.
 */
/** UNA sola fuente para el barrido y para `llamadas()`: dos copias divergian en silencio. */
export const SPAWN = /(?<![.\w])(?:spawn|spawnSync|execFile|execFileSync|exec|execSync|fork)\(/g

/** Las opciones de CADA llamada: las de linea y las de un `const options = {...}` previo, en su sitio. */
export function llamadas(f: string): readonly string[] {
  const objetos = new Map([...f.matchAll(/\bconst (\w+) = (\{[^}\n]*\})/g)].map((m): [string, string] => [m[1], m[2]])) // prettier-ignore
  return [...f.matchAll(SPAWN)].map((m) => f.slice(m.index, m.index + 320).replace(/\b\w+\b/g, (id) => objetos.get(id) ?? id)) // prettier-ignore
}

/** Los constructores bendecidos POR NOMBRE: el recorte historico, cada uno con
 *  sus propias pruebas al lado. */
const SEGURO = /^(?:build(?:Gate)?Env|gitEnv(?:Remoto)?)\(/

/**
 * Y los bendecidos POR SU FORMA, que es lo que cierra la clase.
 *
 * Un constructor que parte de un objeto LITERAL y copia claves NOMBRADAS
 * (`process.env[clave]`) es una LISTA BLANCA: mas estricta que el recorte que
 * `SEGURO` bendice por nombre, no menos. Juzgarlo por el nombre marcaba en rojo
 * justo el codigo MAS seguro — paso el 2026-10-02 con `entornoDelMerge`, dejo
 * `main` en rojo y caduco una propuesta inocente (DEUDAS §16).
 *
 * Y la lista de nombres era, ademas, el error que el docblock de este mismo
 * guardian denuncia: enumerar a mano lo que se puede derivar. Un constructor
 * nuevo y mas estricto pasa ahora por ser lo que ES, no por estar en una lista.
 */
const HEREDA = /\.\.\.\s*process\.env|return\s+process\.env\b(?!\s*\[)/
const COPIA_NOMBRADA = /=\s*\{[^}]*\}[\s\S]*?process\.env\s*\[/

const esListaBlanca = (cuerpo: string): boolean =>
  !HEREDA.test(cuerpo) && COPIA_NOMBRADA.test(cuerpo)

/** El cuerpo de una funcion, de su firma al `}` de columna cero. */
function cuerpoDeFuncion(f: string, nombre: string): string | null {
  const m = new RegExp(`function ${nombre}\\([^)]*\\)[^{]*\\{([\\s\\S]*?)\\n\\}`).exec(f)
  return m === null ? null : m[1]
}

/** El `env` de ESA llamada llega a un constructor acotado: bendecido por nombre,
 *  o una lista blanca reconocida por su forma. `process.env` crudo, o sin clave
 *  `env` —que hereda todo—, no. */
export function acota(f: string, valor: string, saltos = 3): boolean {
  const id = /^(\w+)(\()?/.exec(valor)
  if (SEGURO.test(valor) || id === null || saltos === 0) return SEGURO.test(valor)
  if (id[2] !== undefined) {
    const cuerpo = cuerpoDeFuncion(f, id[1])
    if (cuerpo !== null && esListaBlanca(cuerpo)) return true
  }
  const decl = id[2] ? `function ${id[1]}\\([^)]*\\)[^{]*\\{\\s*return ` : `\\bconst ${id[1]} = `
  const m = new RegExp(`${decl}(?:\\{\\s*\\.\\.\\.)?([^\\n]+)`).exec(f)
  return m !== null && acota(f, m[1], saltos - 1)
}

export const envDe = (o: string): string => { const m = /\benv\b(?:\s*:\s*([^,}\n]+))?/.exec(o); return m === null ? '' : (m[1] ?? 'env') } // prettier-ignore

export const sinAcotar = (f: string): readonly string[] =>
  llamadas(f).filter((o) => /\bcwd\b/.test(o) && !acota(f, envDe(o)))
