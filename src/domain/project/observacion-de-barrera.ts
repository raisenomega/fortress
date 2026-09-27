import type { SelfNoteDraft } from '../system/self-observation'
import type { BarreraRota } from './barrera-rota'
import { sanearParaPrompt } from '../shared/sanear-para-prompt'

/**
 * Lo que FORTRESS aprende cuando un proyecto declara una proteccion que no puede
 * arrancar. Hermana de `observacionDeDenial`, y con la misma doctrina:
 *
 * SALE DEL DATO, no de la prosa. Nadie le pregunta al modelo si vio algo raro
 * —un spawn por turno— ni se le pide un bloque en su respuesta, que el operador
 * veria teclearse porque el chat emite EN VIVO. El `.claude/settings.json` ya lo
 * decia y el PATH ya lo desmentia; solo se perdia.
 *
 * `kind: 'bug'` y no `limitacion`: una limitacion es FORTRESS topandose con un
 * techo. Esto es algo ROTO, y arreglable con una palabra.
 *
 * LA NOTA ES DETERMINISTA, y eso no es cosmetico: `observation_sightings` tiene
 * `UNIQUE(observation_id, source_project, note)` con `INSERT OR IGNORE`, asi que
 * la misma barrera del mismo proyecto escribe UN avistamiento por mucho que el
 * pre-vuelo corra en cada turno. Una nota redactada por un modelo bailaria en
 * cada palabra y sembraria un avistamiento por turno. Derivar del dato se paga
 * solo aqui.
 *
 * SEGURA POR CONSTRUCCION: matcher, nombre del guion e interprete. Ni la ruta
 * del hook ni su contenido, que son del cliente. Y los tres SANEADOS con el
 * saneador del prompt (aplanados y acotados): salen crudos del settings.json de
 * un repo auditado y esta nota acaba en `self_observations` y en el export del
 * backlog, que otro agente lee (cerco de ADR-085). Sigue siendo determinista.
 */
export function observacionDeBarrera(barrera: BarreraRota): SelfNoteDraft {
  return { kind: 'bug', area: 'barrera-del-proyecto', note: nota(barrera) }
}

/** Lo que cabe de un dato del cliente en una nota que se PERSISTE y se exporta. */
const MAX = 60
const limpio = (texto: string): string => sanearParaPrompt(texto, MAX)

function nota(b: BarreraRota): string {
  const pista =
    b.alternativa === null
      ? `ningun interprete alternativo en el PATH`
      : `fix: cambiar el interprete a «${limpio(b.alternativa)}», que si existe`
  return (
    `Barrera declarada y MUERTA: el hook PreToolUse (${limpio(b.matcher)}) llama a ` +
    `${limpio(b.guion)} con el interprete «${limpio(b.interprete)}», que no existe en el PATH. ` +
    `El hook no arranca, asi que lo que protege queda sin proteger; ${pista}.`
  )
}

/** Las de un proyecto, sin repetir. Dos hooks rotos por el MISMO interprete son
 *  un fallo con dos sintomas; `asentarNotas` los funde aparte, pero llegar aqui
 *  con la lista ya limpia ahorra escrituras y deja la nota que mas dice. */
export function observacionesDeBarreras(rotas: readonly BarreraRota[]): readonly SelfNoteDraft[] {
  return rotas.map(observacionDeBarrera)
}
