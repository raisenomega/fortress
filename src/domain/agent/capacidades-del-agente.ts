/**
 * Lo que un agente PUEDE de verdad, leido de los args con que se lanza y no de
 * lo que alguien crea que le dio. Es el docblock de `--allowedTools` que mentia,
 * aplicado al prompt: el prompt no AFIRMA capacidades, las REFLEJA de aqui.
 *
 * Dos premisas medidas. `--allowedTools` solo PRE-APRUEBA: lo unico que quita
 * una herramienta es `--disallowedTools` (2026-09-20). Y en vivo, con los args
 * exactos del motor —sin `--disallowedTools`—, los cuatro agentes corrieron
 * Bash (2026-09-21). Por eso `bash` no mira el allowlist: mira la lista negada.
 */
export interface Capacidades {
  readonly bash: boolean
  /** `acceptEdits` es lo unico que deja escribir en headless: Write/Edit piden
   *  permiso y nadie lo concede. */
  readonly edita: boolean
}

/** Los valores que siguen a `flag` hasta el siguiente `--…`: asi van las listas
 *  del CLI (`--allowedTools A B C`). Sin el flag, ninguno. */
function valoresDe(args: readonly string[], flag: string): readonly string[] {
  const i = args.indexOf(flag)
  if (i === -1) return []
  const resto = args.slice(i + 1)
  const fin = resto.findIndex((a) => a.startsWith('--'))
  return fin === -1 ? resto : resto.slice(0, fin)
}

export function capacidadesDe(args: readonly string[]): Capacidades {
  return {
    bash: !valoresDe(args, '--disallowedTools').includes('Bash'),
    edita: valoresDe(args, '--permission-mode')[0] === 'acceptEdits'
  }
}

const CON_BASH: readonly string[] = [
  'Tienes Bash: puedes correr git, diffear y medir ejecutando. Corre CONTENIDO en la',
  'caja del proyecto (ADR-092): red solo a los registros de paquetes, sin credenciales',
  'del operador y sin ver a otro cliente. OJO: solo corren los comandos pre-aprobados',
  'de este brief; lo demas (npm audit, curl...) se niega sin preguntar, porque en',
  'headless nadie aprueba. Lo que midas ejecutando vale mas que lo que supongas; si',
  'un dato exige un comando no concedido, dilo en "notes" en vez de suponerlo.',
  ''
]

const SIN_BASH: readonly string[] = [
  'NO tienes Bash: no puedes correr git, ni diffear, ni medir nada ejecutandolo. Si te',
  'falta un dato que solo daria un comando, dilo en "notes" en vez de suponerlo.',
  ''
]

/** El bloque del prompt que REFLEJA las capacidades. Nunca texto fijo: el que
 *  hubo —«NO tienes Bash»— era falso para el motor y lo leyo cada analista. */
export function bloqueDeCapacidades(c: Capacidades): readonly string[] {
  return c.bash ? CON_BASH : SIN_BASH
}
