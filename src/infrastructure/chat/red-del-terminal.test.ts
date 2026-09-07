import { afterEach, describe, expect, it } from 'vitest'
import { asuntos, crearRepo, existe, leer, limpiar } from '../git/checkpoint-fixture'
import { cliQue, redReal } from './cli-de-mentira'
import { contexto, CRITICAL, enviar, proyectoEn } from './red-del-terminal-fixture'

const dirs: string[] = []
const repo = (): string => {
  const dir = crearRepo()
  dirs.push(dir)
  return dir
}
afterEach(() => limpiar(dirs))

/**
 * El Terminal en autonomo, por el camino REAL de `sendMessage`, sobre un repo
 * git de verdad en /tmp: la unica diferencia con produccion es que el CLI es de
 * mentira (edita el arbol y contesta lo que se le dice) y el typecheck tambien.
 */
describe('Terminal en autonomo con la red del ADR-079', () => {
  it('a) exito: las ediciones se quedan y el historial no tiene checkpoint', async () => {
    const dir = repo()
    const { context, textos } = contexto(proyectoEn(dir))

    const r = await enviar(context, cliQue(true), {}, redReal())

    expect(r.ok).toBe(true)
    expect(leer(dir, 'a.txt')).toBe('editado\n')
    expect(existe(dir, 'b.txt')).toBe(true)
    expect(asuntos(dir)).toEqual(['base'])
    expect(textos[1]).not.toContain('REVERTIDO')
  })

  it('b) el agente falla: se revierte —fichero nuevo incluido— y el texto lo dice', async () => {
    const dir = repo()
    const { context, textos } = contexto(proyectoEn(dir))

    const r = await enviar(context, cliQue(true, { failed: true }), {}, redReal())

    expect(r.ok).toBe(true)
    expect(leer(dir, 'a.txt')).toBe('base\n')
    expect(existe(dir, 'b.txt')).toBe(false)
    expect(asuntos(dir)).toEqual(['base'])
    expect(textos[1]).toContain('REVERTIDO')
  })
})

describe('lo que revierte y lo que no', () => {
  it('el typecheck en rojo tras el turno tambien revierte', async () => {
    const dir = repo()
    const { context, textos } = contexto(proyectoEn(dir))

    await enviar(context, cliQue(true), {}, redReal(false))

    expect(leer(dir, 'a.txt')).toBe('base\n')
    expect(textos[1]).toContain('REVERTIDO')
  })

  it('c) el paro por CRITICAL NO revierte: viaja como stoppedBy, no como failed', async () => {
    const dir = repo()
    const { context, textos } = contexto(proyectoEn(dir))
    // "revisa vulnerabilidades" es una ORDEN que dispara el workflow de seguridad
    // sin tocar un area protegida (que degradaria a supervisado). Su primer paso
    // lleva puerta: con un CRITICAL, el workflow para ahi.
    const cli = cliQue(true, { text: CRITICAL })

    const r = await enviar(context, cli, { prompt: 'revisa vulnerabilidades' }, redReal())

    expect(r.ok).toBe(true)
    expect(cli.peticiones).toHaveLength(1)
    expect(leer(dir, 'a.txt')).toBe('editado\n')
    expect(asuntos(dir)).toEqual(['base'])
    expect(textos[1]).not.toContain('REVERTIDO')
  })
})
