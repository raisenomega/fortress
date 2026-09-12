import { describe, expect, it } from 'vitest'
import { ESTA_INSTALACION } from '@domain/system/observacion-de-fallo'
import { RUTA_REDACTADA } from '@domain/system/cerco-de-observacion'
import { observacionDeFalloDeIpc } from '@domain/system/observacion-de-ipc'
import { conOrigen } from '../system/origen-del-fallo'
import { createMemoryDb, seedProject } from './memory-db'
import { createSqliteSelfObservationRepository } from './sqlite-self-observation-repository'
import type { Project } from '@domain/project/project'

const CLIENTE = { id: 'p1', name: 'Health Flow V1_FINAL', path: '/media/disco/ACME' } as Project
const buscar = (id: string): Project | null => (id === 'p1' ? CLIENTE : null)

const nota = observacionDeFalloDeIpc('scan:run', 'TypeError')

describe('de quien es un fallo de IPC cuando llega a la base', () => {
  it('CON proyecto: lleva su nombre y su ruta, que es lo que arma el cerco', () => {
    const o = conOrigen(buscar, nota, 'p1')

    expect(o.sourceProject).toBe('Health Flow V1_FINAL')
    expect(o.projectPath).toBe('/media/disco/ACME')
  })

  it('SIN proyecto, o con un id que ya no existe: la instalacion', () => {
    // Un proyecto se puede quitar de FORTRESS entre el fallo y su asiento; el
    // backlog sobrevive a eso por doctrina, asi que no se pierde la observacion.
    expect(conOrigen(buscar, nota, undefined).sourceProject).toBe(ESTA_INSTALACION)
    expect(conOrigen(buscar, nota, 'ya-no-existe').sourceProject).toBe(ESTA_INSTALACION)
    expect(conOrigen(buscar, nota, 'ya-no-existe').projectPath).toBeUndefined()
  })

  it('y ese projectPath enciende la CUARTA regla del cerco de verdad', () => {
    // La nota de un fallo no lleva rutas hoy —solo el canal y el tipo—, asi que
    // esto prueba que el cerco queda ARMADO, no que haga falta ahora mismo: el
    // dia que algo del texto del fallo lleve la raiz del cliente, la tacha.
    const repo = createSqliteSelfObservationRepository(createMemoryDb())
    const conRaiz = { ...nota, note: 'no pude leer /media/disco/ACME entero' }

    const fila = repo.add(conOrigen(buscar, conRaiz, 'p1'))

    expect(fila.note).not.toContain('/media/disco/ACME')
    expect(fila.note).toContain(RUTA_REDACTADA)
  })

  it('MISMA TUBERIA: pasa por `add`, con su dedup y su area de IPC', () => {
    const db = createMemoryDb()
    seedProject(db, 'p1')
    const repo = createSqliteSelfObservationRepository(db)

    const primera = repo.add(conOrigen(buscar, nota, 'p1'))
    const segunda = repo.add(conOrigen(buscar, nota, 'p1'))

    expect(segunda.id).toBe(primera.id)
    expect(repo.listOpen()).toHaveLength(1)
    expect(repo.listOpen()[0].area).toBe('fallo-de-ipc')
  })
})
