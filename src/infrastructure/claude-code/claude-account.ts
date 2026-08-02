import { spawn, spawnSync } from 'child_process'
import { NO_ACCOUNT, type Account } from '@domain/settings/account'
import { CLAUDE_BIN } from './claude-cli'

interface StatusJson {
  readonly loggedIn?: boolean
  readonly email?: string
  readonly subscriptionType?: string
}

/** Cuenta con la que `claude` esta conectado ahora mismo, si lo esta. */
export function readAccount(): Account {
  try {
    const probe = spawnSync(CLAUDE_BIN, ['auth', 'status'], { encoding: 'utf8', timeout: 10_000 })
    if (probe.status !== 0) return NO_ACCOUNT

    const status = JSON.parse(probe.stdout) as StatusJson
    return {
      loggedIn: status.loggedIn === true,
      email: status.email ?? null,
      plan: status.subscriptionType ?? null
    }
  } catch {
    return NO_ACCOUNT
  }
}

/**
 * Arranca el inicio de sesion con la suscripcion. El CLI abre el navegador y
 * espera; su salida se reenvia tal cual para que el operador vea la URL o el
 * codigo si hace falta pegarlo, en vez de mirar una caja negra.
 */
export function startLogin(onOutput: (text: string) => void): void {
  const child = spawn(CLAUDE_BIN, ['auth', 'login', '--claudeai'], { env: process.env })

  child.stdout.on('data', (chunk: Buffer) => onOutput(chunk.toString()))
  child.stderr.on('data', (chunk: Buffer) => onOutput(chunk.toString()))
  child.on('error', (error) => onOutput(`No se pudo iniciar sesion: ${error.message}`))
  child.on('close', () => onOutput('\n[sesion terminada]\n'))
}
