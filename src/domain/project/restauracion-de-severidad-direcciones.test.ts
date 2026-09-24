import { describe, expect, it } from 'vitest'
import { planDeRestauracion, type FilaDeFamilia, type Nota } from './restauracion-de-severidad'

const fila = (over: Partial<FilaDeFamilia> = {}): FilaDeFamilia => ({
  id: 'f1', file: 'src/theme.css', line: 23, tipo: 'accesibilidad', severity: 'HIGH', lifecycle: 'ACTIVE', title: 'Contraste 4.08:1', ...over
}) // prettier-ignore
const nota = (evidence: string, at = '2026-09-12T10:00:00Z'): Nota => ({ at, evidence })
describe('la restauracion va en las dos direcciones (ADR-103, casilla 3)', () => {
  it('la tabla tambien BAJO lo que el modelo puso mas alto: vuelve a subir', () => {
    const bajada = fila({ id: 'r', file: 'docs/RESTORE.md', line: 98, tipo: 'continuidad-y-backups', severity: 'LOW' }) // prettier-ignore
    const { plan } = planDeRestauracion([bajada], [nota('docs/RESTORE.md:98 HIGH→LOW (local·disponibilidad·defensa-en-profundidad)')]) // prettier-ignore
    expect(plan).toEqual([expect.objectContaining({ id: 'r', de: 'LOW', a: 'HIGH' })])
  })
})
