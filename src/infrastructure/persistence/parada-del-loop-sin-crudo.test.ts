import { describe, expect, it } from 'vitest'
import { observacionDeParada } from '@domain/loop/observacion-de-parada'
import { claseDelFallo } from '@domain/loop/clase-del-fallo'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'

const PROY = { name: 'ACME', path: '/media/disco/clientes/ACME' }

/** Diez reintentos reales: el mensaje lleva la hora y el numero de intento, asi
 *  que BAILA aunque el cerco le tache la ruta. */
const fallo = (i: number): Error =>
  Object.assign(
    new TypeError(`Cannot read properties of undefined at ${new Date(1759000000000 + i * 60000).toISOString()} (intento ${i + 1}) en ${PROY.path}/src/api/x.ts`), // prettier-ignore
    { name: 'TypeError' }
  )

interface Banco {
  readonly repo: ReturnType<typeof createSqliteSelfObservationRepository>
  /** Los AVISTAMIENTOS, no los proyectos: `vistaEn` cuenta proyectos distintos y
   *  una nota que baila no los infla — lo que infla son las filas de aqui. */
  avistamientos(): number
  nota(): string
}

function banco(): Banco {
  const db = createMemoryDb()
  seedProject(db, 'p1')
  const repo = createSqliteSelfObservationRepository(db)
  return {
    repo,
    avistamientos: () =>
      (db.prepare("SELECT COUNT(*) n FROM observation_sightings s JOIN self_observations o ON o.id = s.observation_id WHERE o.area = 'parada-del-loop'").get() as { n: number }).n, // prettier-ignore
    nota: () => repo.listOpen().find((o) => o.area === 'parada-del-loop')?.note ?? ''
  }
}

const asentar = (b: Banco, e: unknown): void => {
  const nota = observacionDeParada('error', null, claseDelFallo(e))
  if (nota) b.repo.add({ ...nota, sourceProject: PROY.name, projectPath: PROY.path })
}

describe('un loop que reintenta no inunda el sistema nervioso', () => {
  it('diez fallos siembran UN avistamiento, no diez', () => {
    // Medido antes del arreglo: 10 avistamientos, uno por reintento, porque la
    // nota llevaba el mensaje crudo y el UNIQUE de avistamientos incluye la nota.
    const b = banco()

    for (let i = 0; i < 10; i += 1) asentar(b, fallo(i))

    expect(b.avistamientos()).toBe(1)
  })

  it('la nota lleva la CLASE, nunca el mensaje', () => {
    const b = banco()

    asentar(b, fallo(3))

    const nota = b.nota()
    expect(nota).toContain('TypeError')
    expect(nota).not.toContain('Cannot read properties')
    expect(nota).not.toContain('intento')
  })

  it('ni tablas, ni correos, ni SQL del cliente llegan a la nota', () => {
    const b = banco()
    const deBd = Object.assign(new Error('column "pacientes.dni" no existe para admin@clinica.es'), { code: 'pacientes.dni' }) // prettier-ignore

    asentar(b, deBd)

    const nota = b.nota()
    for (const dato of ['pacientes', 'dni', 'clinica.es', 'admin@']) expect(nota).not.toContain(dato)
  })
})
