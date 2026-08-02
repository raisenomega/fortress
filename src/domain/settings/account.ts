/** Cuenta de Claude con la que se ejecutan los agentes. */
export interface Account {
  readonly loggedIn: boolean
  readonly email: string | null
  /** max, pro... segun lo que reporte el CLI. */
  readonly plan: string | null
}

export const NO_ACCOUNT: Account = { loggedIn: false, email: null, plan: null }
