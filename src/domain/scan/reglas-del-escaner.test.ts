import { describe, expect, it } from 'vitest'
import { EMPTY_CORPUS } from '../project/corpus-descriptor'
import { buildScanPrompt } from './scan-prompt'
import { SCAN_RULES } from './scan-checklist'

/**
 * Los dos falsos positivos que el escaner ha cometido mas veces, y los dos son
 * de lectura superficial: dar por ausente un control que estaba un salto mas
 * abajo, y nombrar como control esperado algo que solo existe en un comentario.
 */
describe('las reglas del escaner cierran sus dos falsos positivos conocidos', () => {
  it('le pide seguir la llamada un salto antes de marcar un control ausente', () => {
    expect(SCAN_RULES).toContain('sigue la llamada UN salto')
  })

  it('le pide comprobar que el control que nombra existe de verdad en el repo', () => {
    expect(SCAN_RULES).toContain('existe en el repo antes de citarlo')
  })

  it('y las dos viajan en el prompt del escaneo, que es donde sirven', () => {
    const prompt = buildScanPrompt('p', EMPTY_CORPUS)

    expect(prompt).toContain('sigue la llamada UN salto')
    expect(prompt).toContain('Un comentario que describe algo que nunca')
  })
})
