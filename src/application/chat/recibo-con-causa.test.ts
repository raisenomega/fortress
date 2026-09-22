import { describe, expect, it } from 'vitest'
import { CONSERVADO_SIN_VERIFICAR } from '@domain/chat/aviso-sin-verificar'
import { medida } from '@domain/chat/medida-del-arbol'
import type { MotivoSinVerificar } from '@domain/chat/no-se-pudo-verificar'
import type { RedDeReversion } from '@domain/chat/red-de-reversion'
import { conRedDeReversion } from './con-red-de-reversion'
import { textOnly, type ReplyOutcome } from './reply-outcome'

const edito = (): Promise<ReplyOutcome> =>
  Promise.resolve({ ...textOnly('hecho'), edits: ['a.ts'] })

/** Una red que no pudo verificar, y que sabe (o no) POR QUE. */
const red = (porQue: MotivoSinVerificar | null): RedDeReversion => ({
  disponible: () => true,
  verificar: () => Promise.resolve(medida('desconocida', porQue)),
  abrir: () => ({ conservar: () => true, revertir: () => true })
})

/**
 * ADR-091 + ADR-092: lo que se conserva sin verificar dice POR QUE. «Falta la
 * herramienta» era la unica frase, y en un proyecto sobre vfat —o en una
 * maquina sin bwrap— era mentira: culpaba a lo que no era. La causa viaja en
 * el VALOR que devuelve el gate, no en un estado que alguien recuerde.
 */
describe('el recibo de «sin verificar» lleva su causa', () => {
  it('vfat sin enlaces: lo dice, y no habla de herramientas que faltan', async () => {
    const t = await conRedDeReversion(red('sin-enlaces'), '/p', true, edito)
    expect(t.conservado).toBe(true)
    expect(t.aviso).toMatch(/enlaces/)
    expect(t.aviso).not.toMatch(/falta la herramienta/)
  })

  it('sin caja: lo dice como lo que es, de la maquina', async () => {
    const t = await conRedDeReversion(red('sin-caja'), '/p', true, edito)
    expect(t.aviso).toMatch(/caja/)
  })

  it('una red que no sabe por que: el aviso generico de siempre, no silencio', async () => {
    const t = await conRedDeReversion(red(null), '/p', true, edito)
    expect(t.aviso).toContain(CONSERVADO_SIN_VERIFICAR)
  })
})
