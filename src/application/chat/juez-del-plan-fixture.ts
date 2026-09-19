import type { FindingMemory } from '@domain/project/finding-memory'
import { META } from '../repair/juicio-de-omega-fixture'
import type { AppContext } from '../context'
import { juezDelPlan } from './juez-del-plan'

/** Un hallazgo como lo RECUERDA la base. La misma forma que usa el test del
 *  lote (`plan-del-lote.test.ts`): la lista sale de la misma `lineasDelLote`. */
// prettier-ignore
export const memoria = (id: string, over: Partial<FindingMemory> = {}): FindingMemory => ({ id, identity: 'i', severity: 'HIGH', title: `t-${id}`, file: 'a.ts', line: 3, simbolo: null, status: 'open', lifecycle: 'ACTIVE', ...over }) as FindingMemory

/** Los ids del lote. TRES, que es el caso que la ENMIENDA 1 obliga a cubrir: con
 *  uno solo, juzgar contra el primero y juzgar contra los N dan lo mismo, y por
 *  eso el ensayo del 18-sep no destapo el hueco. */
export const LOTE = ['f1', 'f2', 'f3']

/** Lo que `lineasDelLote` devuelve para `LOTE`: una linea por hallazgo vivo. */
export const LINEAS = ['HIGH a.ts:3 — t-f1', 'HIGH a.ts:3 — t-f2', 'HIGH a.ts:3 — t-f3']

/**
 * Contexto que apunta lo FACTURADO —juzgar un plan cuesta y debe constar— y que
 * ademas RECUERDA los hallazgos, porque desde la ENMIENDA 1 el juez los relee de
 * la base en vez de recibirlos hechos (ADR-097 §2.2-bis).
 *
 * Estaba duplicado en los dos ficheros de test del juez; al necesitarlo un
 * tercero se saca aqui, que es la regla de `sanearParaPrompt`: lo que se repite
 * en tres sitios se desfasa en dos.
 */
export function contextoQueApunta(
  recordadas: readonly FindingMemory[] = LOTE.map((id) => memoria(id))
): { context: AppContext; filas: () => readonly boolean[] } {
  const filas: boolean[] = []
  const context = {
    runs: { record: (r: { failed: boolean }) => filas.push(r.failed) },
    findings: { listMemory: () => recordadas }
  } as unknown as AppContext
  return { context, filas: () => filas }
}

const BLOQUE_OK =
  'PLAN:{"ataca_la_causa":"SI","declara_tocar_lo_intocable":"NO","alcance":"AJUSTADO","razon":"ok"}:END-PLAN' // prettier-ignore

/** El juez sobre la memoria que se le de, con los prompts que MANDO a la vista:
 *  es como se comprueba que el lote llego entero sin mirar dentro del prompt. */
export function juezSobre(recordadas?: readonly FindingMemory[]): {
  juez: ReturnType<typeof juezDelPlan>
  prompts: readonly string[]
} {
  const prompts: string[] = []
  const juez = juezDelPlan({
    context: contextoQueApunta(recordadas).context,
    projectId: 'p1',
    cwd: '/p',
    omega: { run: (_a, p) => (prompts.push(p), Promise.resolve({ ok: true, texto: BLOQUE_OK, runMeta: META })) } // prettier-ignore
  })
  return { juez, prompts }
}
