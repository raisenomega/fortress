import type { ResultadoDeTanda } from '@application/repair/medir-la-tanda'
import type { GuiaDeOrden } from '@domain/repair/orden-de-firma'
import type { Result } from '@domain/shared/result'

/**
 * La guia del orden de firma (deuda #2), en su propio grupo del puente:
 * `repair-api.ts` esta al limite de lineas y esto es una superficie distinta
 * —aqui no se firma ni se integra, solo se ordena y se mide—.
 */
export interface TandaApi {
  /** La guia estatica: orden sugerido, grupos y dependencias. Barata. */
  guia(projectId: string): Promise<{ n: number; guia: GuiaDeOrden }>
  /** La sonda del conjunto (+ biseccion en rojo). Ocupa el carril del merge. */
  medir(projectId: string): Promise<Result<ResultadoDeTanda>>
}
