import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

/** PASO 126: el modo CTO en la vista — pins del molde de la casa. */

const fuente = (r: string): string => readFileSync(r, 'utf8')

describe('el modo CTO cableado en la vista', () => {
  it('EL MODO APARECE: la 5a fila del selector es cto, con su seña', () => {
    const menu = fuente('src/presentation/components/construir/ConstruirModeMenu.tsx')
    expect(menu).toContain("mode: 'cto'")
    expect(menu).toContain('nunca firma')
  })

  it('TRANSFERIR sigue vivo: el badge es de TODO mensaje del asistente', () => {
    const msg = fuente('src/presentation/components/construir/MensajeDelConstruir.tsx')
    expect(msg).toContain('<TransferBadge')
    const badge = fuente('src/presentation/components/chat/TransferBadge.tsx')
    expect(badge).toContain('setDraft(text)')
    expect(badge).toContain("setView('chat')")
  })

  it('la union de tipos conoce cto en las DOS capas (store y dominio)', () => {
    expect(fuente('src/presentation/stores/construir-store.ts')).toContain("'cto'")
    expect(fuente('src/domain/chat/hilo-de-chat.ts')).toContain("'cto'")
  })
})
