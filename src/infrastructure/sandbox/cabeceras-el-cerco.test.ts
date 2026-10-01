import { afterEach, describe, expect, it } from 'vitest'
import { homedir } from 'node:os'
import { argsDelSandbox } from '@domain/sandbox/config-del-cli'
import { porQueNoSeMonta } from '@domain/sandbox/ruta-de-la-caja'
import { ARTEFACTOS_PUBLICOS } from './artefactos-publicos'
import { conSandbox } from './con-sandbox'
import { olvidarSonda } from './sonda-de-bwrap'

afterEach(olvidarSonda)

/**
 * ADR-108 §3.3 y §3.6 — el CERCO del bind: la clase A no lo recibe (los agentes
 * editan, no compilan) y la cota de anchura no se toca.
 */
describe('el cerco del bind de cabeceras (ADR-108)', () => {
  it('ninguno lleva version: se monta el padre, no un hijo suyo', () => {
    for (const c of ARTEFACTOS_PUBLICOS) {
      expect({ c, conVersion: /\/\d+\.\d+\.\d+$/.test(c) }).toEqual({ c, conVersion: false })
    }
  })

  /**
   * SOLO LA CLASE B. La clase A es la de los AGENTES —los turnos del Terminal,
   * el generador, el grafo— y el generador EDITA, no compila: no las necesita.
   * Dejarla intacta es lo mas estrecho que se puede firmar.
   */
  it('la clase A NO las recibe: los agentes no compilan', () => {
    const a = conSandbox(['-p', 'x'], process.cwd())
    if (!a.ok) throw new Error(`sin caja: ${a.error}`)
    const settings = JSON.parse(a.value[a.value.indexOf('--settings') + 1] ?? '{}')
    const permitido: readonly string[] = settings.sandbox?.filesystem?.allowRead ?? []

    for (const c of ARTEFACTOS_PUBLICOS) expect(permitido).not.toContain(c)
  })

  /** La cota no se toca: rechaza rutas que CONTIENEN el HOME, y estas viven
   *  DENTRO de el —igual que el `node` de nvm desde el 21-sep—. */
  it('pasan la cota de anchura sin cambiarla', () => {
    const motivo = porQueNoSeMonta({
      proyecto: '/repo/cliente',
      cwd: '/repo/cliente',
      home: homedir(),
      otras: [...ARTEFACTOS_PUBLICOS]
    })

    expect(motivo).toBeNull()
    // Y el contraste: el padre de las cabeceras SI contiene el HOME, y se niega.
    expect(porQueNoSeMonta({ proyecto: '/repo/cliente', cwd: '/repo/cliente', home: homedir(), otras: ['/home'] })).toBe('ruta-demasiado-ancha') // prettier-ignore
  })

  /** Que el fichero del CLI las deje fuera se mira tambien por su contrato: un
   *  dia alguien las anadira «por simetria» y este test dira que no. */
  it('el contrato de la clase A no las nombra', () => {
    const conCabeceras = argsDelSandbox({
      proyecto: '/repo/cliente',
      soloLectura: [...ARTEFACTOS_PUBLICOS],
      registros: []
    })

    expect(conCabeceras.ok).toBe(true)
    expect(JSON.stringify(conSandbox(['-p', 'x'], process.cwd()))).not.toContain('.electron-gyp')
  })
})
