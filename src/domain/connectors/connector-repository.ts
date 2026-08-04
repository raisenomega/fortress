import type { Result } from '../shared/result'
import type { ConnectorCategory, ConnectorState } from './connector'

/** Lo que el operador escribe al anadir un MCP propio. */
export interface NewConnector {
  readonly name: string
  readonly url: string
  readonly description: string
  readonly category: ConnectorCategory
}

/** Puerto de los conectores. La infraestructura (SQLite) lo implementa. */
export interface ConnectorRepository {
  /** Catalogo completo: predefinidos sembrados + los del operador. */
  list(): readonly ConnectorState[]

  setEnabled(id: string, on: boolean): void

  /** La URL ya viene validada por parseConnectorUrl. */
  addCustom(input: NewConnector): Result<ConnectorState>

  /** Los predefinidos no se borran: solo se desactivan. */
  remove(id: string): Result<null>
}
