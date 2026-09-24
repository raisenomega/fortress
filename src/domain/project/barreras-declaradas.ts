import { sanearParaPrompt } from '../shared/sanear-para-prompt'
import { guionDe, interpreteDe, type HookDeclarado } from './hook-del-proyecto'

/** Un hook PreToolUse tal y como el proyecto lo declara, y si su interprete existe. */
export interface BarreraDeclarada {
  readonly matcher: string
  readonly guion: string
  readonly interprete: string
  readonly arranca: boolean
}

/** Lo que el proyecto declara como barrera: hooks y el cerco `.fortress/config`. */
export interface BarrerasDeclaradas {
  readonly hooks: readonly BarreraDeclarada[]
  readonly config: 'presente' | 'ausente'
}

export const SIN_BARRERAS: BarrerasDeclaradas = { hooks: [], config: 'ausente' }

/**
 * Las barreras del proyecto, para el PROMPT (ADR-104, decision 2). Es lo mismo
 * que el pre-vuelo ya parsea (`barrerasRotas`), contado entero en vez de solo
 * lo roto: el agente audita un repo cuyas defensas viven en `.claude/`, que el
 * grafo no indexa, y sin esta lista las busca en el grafo, no las encuentra y
 * las da por inexistentes. `arranca` es lo que el pre-vuelo sabe: el
 * interprete existe en PATH; no se ejecuta nada.
 */
export function barrerasDeclaradas(
  hooks: readonly HookDeclarado[],
  existe: (binario: string) => boolean,
  config: BarrerasDeclaradas['config']
): BarrerasDeclaradas {
  const declaradas = hooks
    .filter((h) => h.comando.trim() !== '')
    .map((h) => ({
      matcher: h.matcher,
      guion: guionDe(h.comando),
      interprete: interpreteDe(h.comando)
    })) // prettier-ignore
    .map((b) => ({ ...b, arranca: existe(b.interprete) }))
  return { hooks: declaradas, config }
}

/**
 * El bloque tal y como entra al prompt del escaner y del analista. Vacio cuando
 * NO hay nada declarado: un bloque que dijera «0 hooks, config ausente» seria
 * una linea mas en cada prompt de cada proyecto sin barreras, para no decir
 * nada. El matcher y el guion salen del repo auditado: se sanean como todo
 * texto ajeno (`sanearParaPrompt`).
 */
export function bloqueDeBarreras(b: BarrerasDeclaradas): readonly string[] {
  if (b.hooks.length === 0 && b.config === 'ausente') return []
  const cabecera = `Barreras que este proyecto declara (${b.hooks.length} hooks PreToolUse; .fortress/config ${b.config}):` // prettier-ignore
  const lineas = b.hooks.map(
    (h) => `- ${sanearParaPrompt(h.matcher, 60)} -> ${sanearParaPrompt(h.guion, 60)} (${sanearParaPrompt(h.interprete, 40)}: ${h.arranca ? 'arranca' : 'NO arranca'})` // prettier-ignore
  )
  return [cabecera, ...lineas]
}
