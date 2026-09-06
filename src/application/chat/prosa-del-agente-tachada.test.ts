import { describe, expect, it } from 'vitest'
import type { Assistant } from '@domain/chat/assistant'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { fakeContext, input, never, NO_CLI, noop } from './chat-test-fixtures'
import { sendMessage } from './send-message'

/** Un modelo que emite por trozos, como el de verdad. */
const emite = (trozos: readonly string[]): Assistant => ({
  stream: (_request, onChunk) => {
    for (const trozo of trozos) onChunk(trozo)
    return Promise.resolve({ text: trozos.join(''), refused: false, usage: EMPTY_USAGE })
  }
})

async function turno(trozos: readonly string[]): Promise<{ vivo: string; guardado: string }> {
  const { context, added } = fakeContext()
  let vivo = ''
  await sendMessage(context, emite(trozos), NO_CLI, input(), (d) => (vivo += d), noop, never)
  return { vivo, guardado: added[1]?.content ?? '' }
}

const TOKEN = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'

describe('la prosa del agente no lleva secretos ni al vivo ni a la base', () => {
  it('un token en lo que el agente ESCRIBE no se pinta ni se guarda', async () => {
    // Los canales mecanicos —comandos, colas del spawn, stderr— ya se tachaban.
    // Este es el cuarto: lo que el agente redacta citando lo que acaba de leer.
    const { vivo, guardado } = await turno([`He encontrado la clave ${TOKEN} en el .env`])

    expect(vivo).not.toContain(TOKEN)
    expect(guardado).not.toContain(TOKEN)
    expect(guardado).toContain('He encontrado la clave')
  })

  it('tambien por su NOMBRE, no solo por su forma', async () => {
    const { vivo, guardado } = await turno(['export GITHUB_TOKEN=zzz-lo-que-sea-aqui'])

    expect(vivo).not.toContain('zzz-lo-que-sea-aqui')
    expect(guardado).not.toContain('zzz-lo-que-sea-aqui')
  })

  it('partido entre dos trozos: al vivo se escapa, a la base NO', async () => {
    // El limite honesto de tachar en vivo, y por que el guardado va aparte: en
    // vivo solo se puede mirar el trozo que sale, y un secreto partido en dos no
    // encaja con ningun patron hasta que se juntan. Lo que se GUARDA si se mira
    // entero, que es donde queda para siempre.
    const { vivo, guardado } = await turno(['La clave es ghp_ABCDEFGHIJ', 'KLMNOPQRSTUVWXYZ012345'])

    expect(vivo).toContain(TOKEN) // se pinto: no hay forma de evitarlo por trozos
    expect(guardado).not.toContain(TOKEN) // pero no se guarda
  })

  it('el texto legitimo del agente queda INTACTO', async () => {
    // Tachar de mas destroza la respuesta: la leccion de `monkey` y `keyboard`.
    const prosa = 'El monkey patching del keyboard usa una key de un mapa, no un secreto'
    const { vivo, guardado } = await turno([prosa])

    expect(guardado).toBe(prosa)
    expect(vivo).toBe(prosa)
  })
})
