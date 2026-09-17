import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SIN_RED_GIT_SUPERVISADO } from '../settings/operation-mode'
import { DEFENSAS_INNEGOCIABLES } from './innegociables-defensa'

const fuente = (ruta: string): string => readFileSync(ruta, 'utf8')

describe('la red del ADR-079 esta protegida contra el propio Motor', () => {
  it('sus DOS mitades entran en la lista, no solo una', () => {
    // Es el fallo que ya mordio dos veces: se protege al que juzga y no al que
    // decide, o se arregla una copia y la gemela se queda con el bug.
    expect(DEFENSAS_INNEGOCIABLES).toContain('src/infrastructure/git/checkpoint-transitorio.ts')
    expect(DEFENSAS_INNEGOCIABLES).toContain('src/application/chat/con-red-de-reversion.ts')
  })
})

describe('redDisponible mira si git PUEDE commitear', () => {
  const cp = fuente('src/infrastructure/git/checkpoint-transitorio.ts')

  it('la identidad entra en la condicion, no solo raiz e historia', () => {
    expect(cp).toMatch(/isRepoRoot\(cwd\) && tieneHistoria\(cwd\) && puedeCommitear\(cwd\)/)
  })

  it('y la mide con la señal que de verdad falla: GIT_COMMITTER_IDENT', () => {
    // Medido: sin user.email sale con codigo 128, asi que `git()` lanza.
    expect(cp).toMatch(/gitResponde\(cwd, \['var', 'GIT_COMMITTER_IDENT'\]\)/)
  })

  it('vive en el MISMO fichero que abrirCheckpoint: la invariante se cumple', () => {
    expect(cp).toContain('export function redDisponible')
    expect(cp).toContain('export function abrirCheckpoint')
  })
})

describe('el aviso da el remedio correcto', () => {
  it('nombra las DOS causas, no solo la de iniciar git', () => {
    expect(SIN_RED_GIT_SUPERVISADO).toMatch(/user\.email/)
    expect(SIN_RED_GIT_SUPERVISADO).toMatch(/no hay repositorio git/)
    // En un repo que YA tiene git, «inicia git» mandaba a hacer algo inutil.
    expect(SIN_RED_GIT_SUPERVISADO).not.toMatch(/Inicia git en la raiz/)
  })
})

describe('el innegociable no se toca: solo cambia el VALOR que recibe', () => {
  it('modo-efectivo sigue degradando por `!pedido.redGit`, sin saber la causa', () => {
    const modo = fuente('src/domain/settings/modo-efectivo.ts')

    expect(modo).toContain('!pedido.redGit')
    expect(modo).not.toMatch(/GIT_COMMITTER_IDENT|puedeCommitear|user\.email/)
  })
})
