import { createHash } from 'node:crypto'
import type { CheckpointDelTurno } from '@domain/chat/red-de-reversion'
import type { HallazgoJuzgado } from '@domain/repair/hallazgo-juzgado'
import { SIN_JUZGAR, type VeredictoDelTurno } from '@domain/chat/veredicto-del-turno'
import { juzgar, type DepsDelJuicio } from '../repair/juicio-de-omega'
import { recordMotorRun } from '../repair/record-motor-run'
import { asentarNotasDelProyecto } from '../system/asentar-notas'
import type { AppContext } from '../context'

export interface JuezDelTurno {
  /** `objeciones`: lo que el tribunal encontro, para que OMEGA juzgue INFORMADO
   *  (ADR-096, Decision 1). Opcional: sin Fase B no hay tribunal y el juez se
   *  comporta como siempre. Alimenta los cinco ejes; no anade ninguno. */
  (
    cp: CheckpointDelTurno,
    plan: HallazgoJuzgado,
    objeciones?: readonly string[]
  ): Promise<VeredictoDelTurno>
}

export interface JuezDeps {
  readonly context: AppContext
  readonly projectId: string
  readonly cwd: string
  readonly omega: DepsDelJuicio['omega']
}

/**
 * OMEGA sobre lo que el turno acaba de escribir, ANTES de conservarlo (ADR-090).
 *
 * Lee el trabajo por el puerto del checkpoint —el diff, los ficheros y su
 * contenido previo— asi que no navega el proyecto: revisa exactamente lo que el
 * agente toco, igual que en el Motor.
 *
 * FACTURA Y NOTAS van con el projectId del Terminal: este juicio cuesta y se
 * anota en `agent_runs` como cualquier otro, y lo que OMEGA note de FORTRESS
 * entra al backlog de auto-mejora (ADR-085). Que el juicio lo pida el Terminal y
 * no el Motor no lo hace gratis ni mudo.
 *
 * Si no se puede leer el trabajo NO se inventa un veredicto: sale SIN_JUZGAR y
 * decide el gate, como antes de existir esta pieza.
 */
export function juezConOmega(deps: JuezDeps): JuezDelTurno {
  return async (cp, plan) => {
    const trabajo = cp.diff?.() ?? null
    if (trabajo === null || trabajo.tocados.length === 0) return SIN_JUZGAR

    const lee = {
      changedFiles: () => Promise.resolve(trabajo.tocados),
      diffText: () => Promise.resolve(trabajo.diffText),
      readPost: (_arbol: string, rel: string) => trabajo.actual(rel),
      readPre: (_a: string, _b: string, rel: string) => Promise.resolve(trabajo.previo(rel))
    }
    const corpus = deps.context.corpus.of(deps.cwd)
    const entrada = { arbol: deps.cwd, baseSha: '', analysis: plan, corpus }
    const juicio = await juzgar(entrada, { ...lee, omega: deps.omega })

    const { context, projectId } = deps
    recordMotorRun(context, projectId, 'sentinel-omega', juicio.crudo.runMeta, juicio.computed === null) // prettier-ignore
    if (juicio.crudo.ok) asentarNotasDelProyecto(context, projectId, juicio.crudo.notas)

    if (juicio.computed === null) return SIN_JUZGAR
    if (juicio.computed === 'APROBADO') return { juzgado: true, aprobado: true }
    const huella = createHash('sha1').update(trabajo.diffText).digest('hex')
    return { juzgado: true, aprobado: false, razon: juicio.crudo.verdict.razon, huella }
  }
}
