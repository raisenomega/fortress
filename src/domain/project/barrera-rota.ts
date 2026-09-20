import { guionDe, interpreteDe, type HookDeclarado } from './hook-del-proyecto'

/**
 * Una barrera que el proyecto DECLARA y que no puede arrancar.
 *
 * No es un hook que falla: es un hook que nunca corre. El proyecto cree estar
 * protegido —lo escribio en su settings— y no lo esta. Medido en
 * `raisen-nucleo` el 2026-09-20: `PreToolUse` sobre `Write|Edit|MultiEdit`
 * invoca `python`, y en esta maquina `python` no existe; solo `python3`. El
 * guardian de los invariantes del cliente llevaba ahi sin arrancar desde julio.
 */
export interface BarreraRota {
  readonly matcher: string
  readonly guion: string
  readonly interprete: string
  /** El mismo nombre con un `3` detras, si ESE si existe. Es la unica pista que
   *  se ofrece, y se ofrece porque es la causa real de los dos casos vistos
   *  (`python` -> `python3`); no se adivina nada mas. */
  readonly alternativa: string | null
}

/**
 * Las barreras rotas de una lista de hooks. `existe` se inyecta —el dominio no
 * mira el disco— y quien lo implementa NO usa una shell: el comando sale del
 * `.claude/settings.json` de un proyecto AUDITADO, o sea de codigo ajeno, y
 * pasarlo por `sh -c` seria inyeccion de comandos desde el repo del cliente.
 */
export function barrerasRotas(
  hooks: readonly HookDeclarado[],
  existe: (binario: string) => boolean
): readonly BarreraRota[] {
  return hooks.map((h) => siNoArranca(h, existe)).filter((b): b is BarreraRota => b !== null)
}

function siNoArranca(
  hook: HookDeclarado,
  existe: (binario: string) => boolean
): BarreraRota | null {
  const interprete = interpreteDe(hook.comando)
  // Un comando vacio no es una barrera rota: es una entrada sin hook. No se
  // inventa un hallazgo donde el proyecto no declaro nada.
  if (interprete === '' || existe(interprete)) return null

  const conTres = `${interprete}3`
  return {
    matcher: hook.matcher,
    guion: guionDe(hook.comando),
    interprete,
    alternativa: existe(conTres) ? conTres : null
  }
}
