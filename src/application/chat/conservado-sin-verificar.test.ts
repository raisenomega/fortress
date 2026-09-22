import { describe, expect, it } from 'vitest'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { CONSERVADO_SIN_VERIFICAR } from '@domain/chat/aviso-sin-verificar'
import { medida } from '@domain/chat/medida-del-arbol'
import type { VerificacionDelArbol } from '@domain/chat/verificacion-del-arbol'
import { conRedDeReversion } from './con-red-de-reversion'
import { textOnly, type ReplyOutcome } from './reply-outcome'

const edito = (): Promise<ReplyOutcome> =>
  Promise.resolve({ ...textOnly('hecho'), edits: ['vercel.json'] })

const red = (arbol: VerificacionDelArbol): RedDeReversion & { pasos: string[] } => {
  const pasos: string[] = []
  return {
    pasos,
    disponible: () => true,
    verificar: () => Promise.resolve(medida(arbol)),
    abrir: () => ({
      conservar: () => (pasos.push('conservar'), true),
      revertir: () => (pasos.push('revertir'), true)
    })
  }
}

/**
 * ADR-091. La pieza 2 crea el primer caso en que algo se conserva SIN haberse
 * compilado. Si eso llegara mudo, el operador leeria un turno conservado y
 * creeria que paso el gate — que es justo la mentira que el ADR prohibe.
 *
 * Por eso el recibo viaja CON esta pieza y no con la 4: la 4 hace el parte
 * bonito, pero la ventana muda no puede existir ni un commit.
 */
describe('lo conservado sin verificar no se queda mudo', () => {
  it('DESCONOCIDA conserva —no castiga al fix— y lo DICE', async () => {
    const r = red('desconocida')

    const turno = await conRedDeReversion(r, '/p', true, edito)

    expect(turno.conservado).toBe(true)
    expect(r.pasos).toEqual(['conservar'])
    expect(turno.aviso).toContain('SIN comprobar que el proyecto compila')
    expect(turno.arbol).toBe('desconocida')
  })

  it('VERDE conserva y NO dice nada: no hay nada que avisar', async () => {
    const turno = await conRedDeReversion(red('verde'), '/p', true, edito)

    expect(turno.conservado).toBe(true)
    expect(turno.aviso).toBe('')
  })

  it('ROJO revierte, y no se le cuelga el aviso de sin-verificar', async () => {
    const r = red('rojo')

    const turno = await conRedDeReversion(r, '/p', true, edito)

    expect(r.pasos).toEqual(['revertir'])
    expect(turno.aviso).not.toContain(CONSERVADO_SIN_VERIFICAR)
  })

  it('el aviso habla de compilar, no de codigos de error: lo lee cualquiera', () => {
    expect(CONSERVADO_SIN_VERIFICAR).not.toMatch(/127|rc=|exit|stderr/)
    expect(CONSERVADO_SIN_VERIFICAR).toContain('Compruebalo tu antes de darlo por bueno')
  })
})
