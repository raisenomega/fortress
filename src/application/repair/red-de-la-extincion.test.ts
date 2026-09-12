import { describe, expect, it } from 'vitest'
import { planRepair } from './plan-repair'
import { bench, hallazgo } from './plan-repair-fixture'
import type { Opciones } from './plan-repair-bench-types'

const CSP = "content=\"style-src 'self' 'unsafe-inline'\""
const base: Opciones = {
  findings: [hallazgo('f1', 'src/renderer/index.html')],
  verdictStatus: 'OBSOLETO'
}

async function corrida(opts: Opciones): Promise<ReturnType<typeof bench>> {
  const banco = bench(opts)
  await planRepair(banco.context, 'p1')
  return banco
}

describe('un OBSOLETO extingue solo si su marcador cuadra con el fichero', () => {
  it('la huella del defecto ya no esta: el hallazgo muere, con su motivo', async () => {
    const b = await corrida({
      ...base,
      evidencia: { marcador: 'execFile(', forma: 'ausente' },
      contenido: 'await runCommand("npm", ["run", "typecheck"])'
    })
    // `quien` es 'agente': lo eligio la COLA. El mismo juicio a peticion del
    // operador escribe 'operador' y no cambia el motivo (ADR-087).
    expect(b.extinguidos).toEqual([{ ids: ['f1'], at: expect.any(String), motivo: 'juicio_obsoleto', quien: 'agente' }]) // prettier-ignore
    expect(b.mitigados).toEqual([])
  })

  it('el control que lo tapa existe ahora: tambien muere', async () => {
    const b = await corrida({
      ...base,
      evidencia: { marcador: 'redactSecrets(stderr)', forma: 'presente' },
      contenido: 'return redactSecrets(stderr).trim() || finalText'
    })
    expect(b.extinguidos[0].motivo).toBe('juicio_obsoleto')
  })
})

describe('sin prueba el hallazgo no muere: se mitiga y espera al operador', () => {
  it('LOS DOS CSP: el marcador sigue vivo, asi que el hallazgo tambien', async () => {
    const b = await corrida({
      ...base,
      evidencia: { marcador: "'unsafe-inline'", forma: 'ausente' },
      contenido: CSP
    })
    expect(b.extinguidos).toEqual([])
    expect(b.mitigados[0].note).toContain('sin prueba comprobable')
    expect(b.mitigados[0].note).toContain("'unsafe-inline'")
  })

  it('sin evidencia no muere nadie: es el analisis que no probo nada', async () => {
    const b = await corrida(base)
    expect(b.extinguidos).toEqual([])
    expect(b.mitigados[0].note).toContain('no trajo evidencia')
  })

  it('un status torcido cae en OBSOLETO como siempre, pero ya no extingue', async () => {
    // parse-analysis deja 'DESCONOCIDO' cuando la clave falta o viene rara, y
    // eso caia derecho a la extincion sin que nadie hubiera dictaminado nada.
    const b = await corrida({ ...base, verdictStatus: 'DESCONOCIDO' })
    expect(b.extinguidos).toEqual([])
    expect(b.mitigados).toHaveLength(1)
  })

  it('un REAL no toca el ciclo de vida del hallazgo', async () => {
    const b = await corrida({ ...base, verdictStatus: 'REAL' })
    expect(b.extinguidos).toEqual([])
    expect(b.mitigados).toEqual([])
  })
})
