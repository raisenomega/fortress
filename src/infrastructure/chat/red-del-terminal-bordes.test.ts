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

  it('e) sin git: en este commit corre como hoy, sin red — la degradacion es el commit 4', async () => {
    const dir = guarda(crearCarpetaSinGit())
    const { context, textos } = contexto(proyectoEn(dir))
    const red = redReal()

    const r = await enviar(context, cliQue(true), {}, red)

    expect(r.ok).toBe(true)
    // Se intento abrir y no hubo red: el null es la senal que el commit 4 usara.
    expect(red.abiertos()).toBe(1)
    expect(existe(dir, 'b.txt')).toBe(true)
    expect(textos[1]).not.toContain('REVERTIDO')
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
