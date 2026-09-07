import { afterEach, describe, expect, it } from 'vitest'
import { asuntos, crearCarpetaSinGit, crearRepo, existe, leer, limpiar } from '../git/checkpoint-fixture' // prettier-ignore
import { cliQue, redReal } from './cli-de-mentira'
import { contexto, enviar, proyectoEn } from './red-del-terminal-fixture'

const dirs: string[] = []
const guarda = (dir: string): string => {
  dirs.push(dir)
  return dir
}
afterEach(() => limpiar(dirs))

describe('los bordes de la red del Terminal', () => {
  it('d) supervisado: el agente corre en plan y no se abre ningun checkpoint', async () => {
    const dir = guarda(crearRepo())
    const { context } = contexto(proyectoEn(dir))
    const cli = cliQue(false)
    const red = redReal()

    await enviar(context, cli, { mode: 'supervisado' }, red)

    expect(cli.peticiones[0].permissionMode).toBe('plan')
    expect(red.abiertos()).toBe(0)
    expect(asuntos(dir)).toEqual(['base'])
  })

  it('e) sin git: no hay red posible, asi que el autonomo degrada a supervisado y lo dice', async () => {
    const dir = guarda(crearCarpetaSinGit())
    const { context, textos } = contexto(proyectoEn(dir))
    const cli = cliQue(false)
    const red = redReal()

    const r = await enviar(context, cli, {}, red)

    expect(r.ok).toBe(true)
    // Degradado ANTES de abrir nada: el agente corre en plan, no hay checkpoint
    // que abrir, y el operador lee por que no tuvo el autonomo que pidio.
    expect(cli.peticiones[0].permissionMode).toBe('plan')
    expect(red.abiertos()).toBe(0)
    expect(existe(dir, 'b.txt')).toBe(false)
    expect(textos[1]).toContain('Sin repositorio git no hay red de reversion')
  })

  it('f) Detener: el hijo muerto resuelve con failed, y eso revierte lo que dejo a medias', async () => {
    const dir = guarda(crearRepo())
    const { context, textos } = contexto(proyectoEn(dir))
    // Lo que deja un SIGKILL: `collectRun` resuelve en `close` con codigo no 0,
    // y `toReply` lo convierte en failed. No lanza. El arbol ya tiene lo que el
    // agente alcanzo a escribir.
    const cli = cliQue(true, { failed: true, text: '' })

    const r = await enviar(context, cli, {}, redReal(), true)

    expect(r.ok).toBe(true)
    expect(leer(dir, 'a.txt')).toBe('base\n')
    expect(existe(dir, 'b.txt')).toBe(false)
    expect(asuntos(dir)).toEqual(['base'])
    expect(textos[1]).toContain('REVERTIDO')
  })
})
