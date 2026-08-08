import { describe, expect, it } from 'vitest'
import { extinguishable, isExtinct, unreported } from './extinction'
import type { FindingMemory } from '../project/finding-memory'

const memory = (title: string, file: string): FindingMemory => ({
  id: file,
  identity: `id:${file}`,
  severity: 'MEDIUM',
  title,
  file,
  line: 1,
  status: 'open',
  lifecycle: 'ACTIVE',
  firstSeen: '2026-08-08T00:00:00Z',
  lastSeen: '2026-08-08T19:32:00Z',
  resolvedAt: null
})

/** Los CUATRO que el escaneo de las 21:54 extinguio sin que nadie los tocara. */
const FALSOS = [
  memory('Los comandos bloqueados se persisten sin redactSecrets', 'stream-events.ts'),
  memory('graph:ab lanza dos ejecuciones sin guardRun', 'graph-action-handlers.ts'),
  memory('El loop autonomo no verifica trusted en el main', 'loop-engine.ts'),
  memory('La API key del entorno se hereda a los scripts', 'run-command.ts')
]
/** El SSRF viejo: su area SI se toco (d1082e7), y el escaneo dejo de nombrarlo. */
const SSRF = memory('SSRF: el filtro de host privado no valida la IP', 'target-url.ts')

/** Nada reportado; solo el archivo del SSRF cambio desde su primera deteccion. */
const NOCHE = {
  reported: new Set<string>(),
  touched: new Set([SSRF.identity])
}

describe('la regla de extincion exige LAS DOS pruebas', () => {
  it('EL CASO REAL: los cuatro falsos extintos NO pueden extinguirse', () => {
    // Sus archivos no cambiaron un byte entre los dos escaneos. Ausencia sola.
    for (const falso of FALSOS) expect(isExtinct(falso, NOCHE)).toBe(false)
    expect(extinguishable(FALSOS, NOCHE)).toEqual([])
  })

  it('EL CASO REAL: el SSRF viejo SI se extingue, porque su area se toco', () => {
    expect(isExtinct(SSRF, NOCHE)).toBe(true)
    expect(extinguishable([...FALSOS, SSRF], NOCHE)).toEqual([SSRF])
  })

  it('los cuatro quedan listados como VIVOS, no desaparecen en silencio', () => {
    expect(unreported([...FALSOS, SSRF], NOCHE)).toEqual(FALSOS)
  })

  it('un hallazgo que el escaneo SI reporta no se extingue, aunque se tocara', () => {
    const evidence = { reported: new Set([SSRF.identity]), touched: new Set([SSRF.identity]) }
    expect(isExtinct(SSRF, evidence)).toBe(false)
    expect(unreported([SSRF], evidence)).toEqual([]) // reportado: ni ausente ni vivo-callado
  })

  it('tocar el archivo sin que el hallazgo desaparezca tampoco extingue', () => {
    // Se edito el archivo y el problema sigue reportandose: no esta arreglado.
    const evidence = { reported: new Set([SSRF.identity]), touched: new Set([SSRF.identity]) }
    expect(extinguishable([SSRF], evidence)).toEqual([])
  })

  it('extinguir es una transicion: lo ya extinto no se vuelve a mirar', () => {
    const yaExtinto = { ...SSRF, lifecycle: 'EXTINCT' as const }
    expect(extinguishable([yaExtinto], NOCHE)).toEqual([])
    expect(unreported([yaExtinto], NOCHE)).toEqual([])
  })
})
