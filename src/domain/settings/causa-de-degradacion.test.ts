import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { ModoPedido } from '@domain/settings/modo-efectivo'
import { efectoDelModo, etiquetaDelEfecto } from './causa-de-degradacion'
import type { EfectoDelModo } from './causa-de-degradacion'

/** PASO 152 (Sello 3a): el EFECTO del toggle por proyecto — reuso de
 *  effectiveMode + REPORTE de la causa por categoria, y su etiqueta exacta. */

const con = (trusted: boolean): Project => ({ trusted }) as Project

interface Caso {
  readonly nombre: string
  readonly pedido: ModoPedido
  readonly efecto: EfectoDelModo
  readonly etiqueta: string
}

const CASOS: readonly Caso[] = [
  {
    nombre: 'toggle supervisado: efectivo supervisado, sin causa',
    pedido: { mode: 'supervisado', selfRepo: false, project: con(true), redGit: true },
    efecto: { modoEfectivo: 'supervisado', causa: null },
    etiqueta: 'supervisado'
  },
  {
    nombre: 'autonomo sano: no degrada',
    pedido: { mode: 'autonomo', selfRepo: false, project: con(true), redGit: true },
    efecto: { modoEfectivo: 'autonomo', causa: null },
    etiqueta: 'autónomo'
  },
  {
    nombre: 'autonomo sin confianza: sinConfianza',
    pedido: { mode: 'autonomo', selfRepo: false, project: con(false), redGit: true },
    efecto: { modoEfectivo: 'supervisado', causa: 'sinConfianza' },
    etiqueta: 'autónomo → solo-lectura · sin confianza'
  },
  {
    nombre: 'autonomo repo propio: repoPropio',
    pedido: { mode: 'autonomo', selfRepo: true, project: con(true), redGit: true },
    efecto: { modoEfectivo: 'supervisado', causa: 'repoPropio' },
    etiqueta: 'autónomo → solo-lectura · repo propio'
  },
  {
    nombre: 'autonomo + confianza + sin red git (Health Flow): gitNoListo',
    pedido: { mode: 'autonomo', selfRepo: false, project: con(true), redGit: false },
    efecto: { modoEfectivo: 'supervisado', causa: 'gitNoListo' },
    etiqueta: 'autónomo → solo-lectura · git no listo'
  }
]

describe('efecto del modo: modo efectivo (reuso) + causa + etiqueta', () => {
  it.each(CASOS)('$nombre', ({ pedido, efecto, etiqueta }) => {
    const e = efectoDelModo(pedido)
    expect(e).toEqual(efecto)
    expect(etiquetaDelEfecto(e)).toBe(etiqueta)
  })

  it('precedencia: sin confianza gana a repo propio y a git no listo', () => {
    const e = efectoDelModo({
      mode: 'autonomo',
      selfRepo: true,
      project: con(false),
      redGit: false
    })
    expect(e.causa).toBe('sinConfianza')
  })
})
