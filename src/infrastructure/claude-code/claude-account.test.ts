import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// Espejo de privacidad-del-hijo.test.ts: la garantia es que el spawn pasa por
// buildEnv, y eso se lee en la fuente, no en el hijo (que abre un navegador).
const fuente = (): string =>
  readFileSync(join(process.cwd(), 'src/infrastructure/claude-code/claude-account.ts'), 'utf8')

describe('claude-account: el login pasa por buildEnv como todos los spawns del CLI', () => {
  it('startLogin arma su entorno con buildEnv(null), sin la key configurada', () => {
    expect(fuente()).toMatch(/\['auth', 'login', '--claudeai'\], \{ env: buildEnv\(null\) \}/)
  })

  it('ningun spawn del fichero hereda process.env explicitamente', () => {
    expect(fuente()).not.toMatch(/env: process\.env/)
  })
})
