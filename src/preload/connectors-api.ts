import type { ConnectorState } from '@domain/connectors/connector'
import type { NewConnector } from '@domain/connectors/connector-repository'
import type { Result } from '@domain/shared/result'

/**
 * Solo el contrato. La implementacion vive en project-apis.ts: este archivo lo
 * importa api-types.ts, que tambien lee el renderer, y el renderer no puede
 * resolver `@infrastructure` (ni debe). Mezclar aqui ipcRenderer rompia el
 * typecheck web. Mismo patron que scan-api.ts y system-api.ts.
 */
export interface ConnectorsApi {
  /** Predefinidos + los del operador, con su estado on/off. */
  list(): Promise<readonly ConnectorState[]>
  setEnabled(id: string, on: boolean): Promise<void>
  /** La URL se revalida en el main: solo https, sin credenciales. */
  add(input: NewConnector): Promise<Result<ConnectorState>>
  /** Falla sobre un predefinido: esos solo se desactivan. */
  remove(id: string): Promise<Result<null>>
}
