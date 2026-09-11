import { describe, expect, it } from 'vitest'
import { reidentificarHallazgos } from './reidentificar-hallazgos'
import { baseConHallazgos, vivas } from './reidentificar-fixture'

describe('el backfill funde los duplicados que solo separaba el simbolo', () => {
  it('dos filas, mismo fichero+linea+tipo, simbolo distinto -> UNA viva', () => {
    const { db } = baseConHallazgos([
      { file: 'services/audit.ts', line: 40, tipo: 'doc-contradice-codigo', simbolo: 'recordEvent', firstSeen: '2026-08-01' }, // prettier-ignore
      { file: 'services/audit.ts', line: 40, tipo: 'doc-contradice-codigo', simbolo: 'AuditService.recordEvent', firstSeen: '2026-09-01' } // prettier-ignore
    ])

    expect(reidentificarHallazgos(db)).toEqual({ reescritas: 2, absorbidas: 1 })
    expect(vivas(db)).toBe(1)
  })

  it('tres filas del mismo sitio dejan una: `auth-guides.md:262` era asi', () => {
    const tres = ['', 'Configuracion de Entorno', 'Variables de Entorno Requeridas'].map((s) => ({
      file: 'docs/auth-guides.md',
      line: 262,
      tipo: 'secreto-versionado',
      simbolo: s
    }))

    const { db } = baseConHallazgos(tres)

    expect(reidentificarHallazgos(db).absorbidas).toBe(2)
    expect(vivas(db)).toBe(1)
  })
})

describe('quien sobrevive, y que se lleva', () => {
  it('la MAS VIEJA, y con la severidad MAXIMA del grupo', () => {
    const { db, ids } = baseConHallazgos([
      { file: 'a.ts', line: 7, tipo: 'cors-permisivo', simbolo: 'x', severity: 'LOW', firstSeen: '2026-08-01' }, // prettier-ignore
      { file: 'a.ts', line: 7, tipo: 'cors-permisivo', simbolo: 'y', severity: 'CRITICAL', firstSeen: '2026-09-01' } // prettier-ignore
    ])

    reidentificarHallazgos(db)

    // Su `first_seen` es la historia real del defecto (ADR-071), y fundir NO
    // baja la gravedad: se queda la del grupo, no la suya.
    const viva = db.prepare("SELECT id, severity FROM findings WHERE lifecycle != 'EXTINCT'").get()
    expect(viva).toEqual({ id: ids[0], severity: 'CRITICAL' })
  })

  it('la absorbida lleva el centinela y de quien es: no puede resucitar', () => {
    const { db, ids } = baseConHallazgos([
      { file: 'a.ts', line: 7, tipo: 'cors-permisivo', simbolo: 'x', firstSeen: '2026-08-01' },
      { file: 'a.ts', line: 7, tipo: 'cors-permisivo', simbolo: 'y', firstSeen: '2026-09-01' }
    ])

    reidentificarHallazgos(db)

    const muerta = db.prepare("SELECT identity, extinct_reason, resolved_at FROM findings WHERE lifecycle = 'EXTINCT'").get() // prettier-ignore
    expect(muerta).toEqual({
      identity: `fusionada:${ids[0]}|a.ts|7|cors-permisivo`,
      extinct_reason: `fusionada-con-${ids[0]}`,
      // NULL a proposito: esto no se resolvio, se fundio.
      resolved_at: null
    })
  })
})
