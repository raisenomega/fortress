import { create } from 'zustand'
import { NO_ACCOUNT, type Account } from '@domain/settings/account'
import { DEFAULT_AUTH_SOURCE, type AuthSource } from '@domain/settings/auth-source'

interface AccountState {
  readonly account: Account
  readonly source: AuthSource
  /** Salida del inicio de sesion, para no mirar una caja negra. */
  readonly loginOutput: string
  setAccount: (account: Account) => void
  setSource: (source: AuthSource) => void
  appendOutput: (text: string) => void
  clearOutput: () => void
}

export const useAccountStore = create<AccountState>((set) => ({
  account: NO_ACCOUNT,
  source: DEFAULT_AUTH_SOURCE,
  loginOutput: '',
  setAccount: (account) => set({ account }),
  setSource: (source) => set({ source }),
  appendOutput: (text) => set((state) => ({ loginOutput: state.loginOutput + text })),
  clearOutput: () => set({ loginOutput: '' })
}))
