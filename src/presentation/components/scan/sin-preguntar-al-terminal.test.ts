import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El fuente, como sus hermanos: no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

describe('«Preguntar al Terminal» se retiro', () => {
  it('ni el boton ni su uso siguen en pie', () => {
    expect(fuente(`${SCAN}ScanActions.tsx`)).not.toMatch(/AskChatButton/)
    expect(() => fuente(`${SCAN}AskChatButton.tsx`)).toThrow()
  })

  it('el relevo es «Resolver en Terminal», por el mismo puente', () => {
    const servicio = fuente('src/presentation/services/resolver-en-terminal.ts')

    expect(servicio).toMatch(/flujo\.setDraft\(borradorDeResolucion\(finding\)\)/)
    expect(fuente('scripts/lib/preview-handoff.cjs')).toContain('Resolver en Terminal')
  })
})
