import { describe, expect, it } from 'vitest'
import { banco } from './auto-merge-fixture'
import { cadenaCompleta, VERDICT } from './collect-post-omega-fixture'
import { firmarIntegracion } from './firmar-integracion'

const firmar = (b: ReturnType<typeof banco>): ReturnType<typeof firmarIntegracion> =>
  firmarIntegracion(b.context, b.deps, { proposalId: 'p-1' })

/** El mismo expediente, cambiando lo que el fix toca o lo que OMEGA dijo. */
function cadena(over: { files?: string[]; verdict?: object }): ReturnType<typeof cadenaCompleta> {
  const events = cadenaCompleta()
  if (over.files) events[1] = { ...events[1], evidenceJson: JSON.stringify({ commitSha: 'fix9876', files: over.files, insertions: 6, deletions: 2 }) } // prettier-ignore
  if (over.verdict) events[5] = { ...events[5], evidenceJson: JSON.stringify({ verdict: over.verdict }) } // prettier-ignore
  return events
}

describe('la firma humana integra lo que OMEGA aprobo', () => {
  it('aplica el merge y lleva la propuesta a MERGEADO', async () => {
    const b = banco()
    expect(await firmar(b)).toMatchObject({ applied: true, mergeCommitSha: 'merge01' })
    expect(b.patches.map((p) => p.state)).toEqual(['APROBADO', 'MERGEADO'])
    expect(b.aplicados[0]).toMatchObject({ projectPath: '/repo', sourceBranch: 'repair/p-1-slug' })
    // Este test miraba solo el retorno, y por eso el asiento pudo pasarse seis
    // dias diciendo "denegada" de once integraciones que estaban en main.
    expect(b.entries[0]).toMatchObject({ verdict: 'ok', kind: 'merge' })
  })

  it('NO integra si OMEGA no aprobo: la firma no revoca un veto', async () => {
    const vetado = banco({
      events: cadena({ verdict: { ...VERDICT, veredicto_global: 'VETADO' } })
    })
    expect(await firmar(vetado)).toMatchObject({ applied: false, reason: 'omega-no-aprobo' })
    expect(vetado.aplicados).toHaveLength(0)
  })
})

describe('lo que la firma NO alcanza', () => {
  it('un fix que toca una defensa de la autonomia no se integra', async () => {
    // El cerco se rinde ante la firma; esta lista no. Su fuerza no puede
    // depender de que alguien la mire durante un lote de quince.
    const defensa = banco({ events: cadena({ files: ['src/infrastructure/run-guard.ts'] }) })
    const r = await firmar(defensa)

    expect(r.applied).toBe(false)
    expect(r.reason).toContain('run-guard.ts')
    expect(defensa.aplicados).toHaveLength(0)
  })

  it('el aviso nombra TODAS las defensas tocadas, no solo la primera', async () => {
    const dos = ['src/infrastructure/run-guard.ts', 'src/domain/posture/private-host.ts']
    const r = await firmar(banco({ events: cadena({ files: dos }) }))
    for (const f of dos) expect(r.reason).toContain(f)
  })
})

describe('la firma es autoridad sobre el cerco, que es de otra cosa', () => {
  it('integra aunque el proyecto no declare auto-merge', async () => {
    // Es el caso de mailbd, donde TODO es firma manual por definicion: sujetar
    // la firma al cerco dejaria ese proyecto sin ninguna via de integracion.
    const b = banco({ config: { kind: 'invalid', reason: 'falta el bloque autoMerge' } })
    expect((await firmar(b)).applied).toBe(true)
  })

  it('integra un HIGH, que el cerco jamas dejaria pasar solo', async () => {
    expect((await firmar(banco({ severity: 'HIGH' }))).applied).toBe(true)
  })
})
