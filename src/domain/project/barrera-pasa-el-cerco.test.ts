import { describe, expect, it } from 'vitest'
import { redactarObservacion } from '../system/cerco-de-observacion'
import { ROTA } from './hook-fixture'
import { observacionDeBarrera } from './observacion-de-barrera'

/**
 * El cerco de ADR-085 redacta `area` y `note` de TODA observacion antes de que
 * toque la base. Una nota que no sobreviva a ese paso llega al backlog sin el
 * dato que la hacia util, y nadie se entera: el cerco no falla, taja.
 */
describe('la nota de la barrera sobrevive al cerco', () => {
  it('el guion y el interprete SIGUEN ahi despues de redactar', () => {
    // Por esto el guion va sin su carpeta: `.claude/hooks/protect-invariants.py`
    // casa con el patron RUTA y saldria tachado, dejando la nota sin el dato.
    const cercada = redactarObservacion(observacionDeBarrera(ROTA).note, '/media/disco/ACME')

    expect(cercada).toContain('protect-invariants.py')
    expect(cercada).toContain('python3')
    expect(cercada).not.toContain('‹ruta del proyecto›')
  })

  it('y la nota no llevaba nada del cliente que tachar', () => {
    const { note } = observacionDeBarrera(ROTA)

    expect(note).not.toContain('/media/disco/ACME')
    expect(note).not.toContain('.claude')
  })

  it('si alguien colase la ruta del hook, el cerco la tajaria igual', () => {
    // La garantia de arriba no depende de que yo me acuerde: esta abajo.
    const conRuta = redactarObservacion('el hook .claude/hooks/protect-invariants.py fallo')

    expect(conRuta).not.toContain('.claude/hooks')
  })
})
