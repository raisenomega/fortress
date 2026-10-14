import { describe, expect, it } from 'vitest'
import { agenteQueRecuerda } from '../agente-que-recuerda'
import { fakeContext, input, noop, PROJECT } from './chat-test-fixtures'
import { runConfigurationTurn } from './run-configuration-turn'

const TOKEN = 'ghp_ABCDEFGHIJKLMNOPQRSTUVWXYZ012345'

async function turno(text: string): Promise<{ guardado: string; devuelto: string }> {
  const { context, added } = fakeContext()
  const { agent } = agenteQueRecuerda(text)
  const out = await runConfigurationTurn(context, agent, PROJECT, input(), noop)
  if (!out.ok) throw new Error('el turno fallo')
  return { guardado: added[1]?.content ?? '', devuelto: out.value.assistant.content }
}

/** La entrevista sale antes de finishTurn: tiene que tachar por su cuenta. */
describe('la entrevista de configuracion no guarda ni devuelve secretos', () => {
  it('un token citado del repo no llega ni a la base ni al renderer', async () => {
    const { guardado, devuelto } = await turno(`En el .env esta ${TOKEN}, lo dejo fuera`)

    expect(guardado).not.toContain(TOKEN)
    expect(devuelto).not.toContain(TOKEN)
    expect(guardado).toContain('lo dejo fuera')
  })

  it('un bloque de doc sin secretos sobrevive intacto', async () => {
    const doc = 'Propongo este CLAUDE.md:\n\n```md\n# Proyecto\n\nUsa `pnpm test` antes de commit.\n```'
    const { guardado, devuelto } = await turno(doc)

    expect(guardado).toBe(doc)
    expect(devuelto).toBe(doc)
  })
})
