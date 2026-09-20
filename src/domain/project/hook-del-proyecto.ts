/**
 * Los hooks que un proyecto declara en su `.claude/settings.json`, leidos como
 * DATO ESTRUCTURADO.
 *
 * Es la misma eleccion que `observacion-de-denial`: alli el CLI dice en
 * `permission_denials` que se bloqueo, aqui el proyecto dice en su JSON que
 * comando va a ejecutar antes de cada Write. Las dos son estructura versionada
 * por un esquema, no prosa. La via descartada era leer el aviso del CLI cuando
 * un hook no arranca: texto ingles sin versionar, que se rompe EN SILENCIO el
 * dia que cambie la frase.
 *
 * NO EJECUTA NADA. Solo separa el comando en sus piezas; quien comprueba si el
 * interprete existe vive en infraestructura, y tampoco lo ejecuta.
 */
export interface HookDeclarado {
  /** Las herramientas que lo disparan: `Write|Edit|MultiEdit`. */
  readonly matcher: string
  readonly comando: string
}

interface Entrada {
  readonly matcher?: unknown
  readonly hooks?: unknown
}

/**
 * Los hooks de un evento (`PreToolUse`, `PostToolUse`...). Tolerante a proposito:
 * un `.claude/settings.json` lo escribe el cliente a mano y el de `raisen-nucleo`
 * ya trae una entrada `Stop` con la forma vieja, sin el `hooks[]` de dentro. Un
 * parser estricto tiraria el fichero ENTERO por esa linea y dejaria de ver los
 * PreToolUse que si estan bien — que son justo la barrera que se quiere mirar.
 */
export function hooksDeclarados(settings: unknown, evento: string): readonly HookDeclarado[] {
  const porEvento = (settings as { hooks?: Record<string, unknown> } | null)?.hooks?.[evento]
  return Array.isArray(porEvento) ? porEvento.flatMap((e) => comandosDe(e as Entrada)) : []
}

function comandosDe(entrada: Entrada): readonly HookDeclarado[] {
  const matcher = typeof entrada.matcher === 'string' ? entrada.matcher : ''
  if (!Array.isArray(entrada.hooks)) return []

  return entrada.hooks
    .filter((h: unknown) => typeof (h as { command?: unknown })?.command === 'string')
    .map((h: unknown) => ({ matcher, comando: (h as { command: string }).command }))
}

/** El primer token: quien tiene que existir para que el hook llegue a arrancar.
 *  `python .claude/hooks/protect-invariants.py` -> `python`. */
export function interpreteDe(comando: string): string {
  return comando.trim().split(/\s+/)[0] ?? ''
}

/**
 * El nombre del guion, SIN su carpeta. Sin carpeta por dos motivos que apuntan
 * al mismo sitio: es lo unico que el operador necesita para arreglarlo, y una
 * ruta con barras la tacharia el cerco de ADR-085 —`.claude/hooks/x.py` casa con
 * el patron `RUTA`— dejando la nota sin el dato que la hacia util.
 */
export function guionDe(comando: string): string {
  const segundo = comando.trim().split(/\s+/)[1] ?? ''
  return segundo.split('/').pop() ?? ''
}
