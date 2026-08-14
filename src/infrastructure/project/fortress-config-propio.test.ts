import { describe, expect, it } from 'vitest'
import { evaluate } from '@domain/repair/auto-merge-evaluation'
import type { AutoMergePolicy } from '@domain/repair/auto-merge-policy'
import { readFortressConfig } from './fortress-config'

/**
 * El `.fortress/config` de ESTE repo, leido por el mismo codigo que lo lee en
 * produccion. `process.cwd()` en vitest es la raiz del repo.
 *
 * Existe porque una errata en ese archivo no rompe nada visible: el parser lo
 * declara invalido, la integracion automatica se retira, y todo sigue
 * funcionando — con una proteccion menos y sin que nadie se entere. Aqui se
 * entera el gate.
 */
function politica(): AutoMergePolicy {
  const config = readFortressConfig(process.cwd())
  if (config.kind !== 'valid') throw new Error(`.fortress/config ${config.kind}`)
  return config.policy
}

const bloquea = (file: string): boolean =>
  !evaluate({ severity: 'LOW', files: [file], insertions: 1, deletions: 0 }, politica()).allowed

describe('.fortress/config de este repo', () => {
  it('el parser lo acepta y la integracion automatica queda activada', () => {
    expect(politica().enabled).toBe(true)
  })

  it('solo LOW: lo demas exige firma humana', () => {
    expect(politica().severities).toEqual(['LOW'])
  })

  it('se cubre a si mismo: nadie cambia la politica sin que un humano la mire', () => {
    expect(bloquea('.fortress/config')).toBe(true)
  })

  it('la capa IPC entera queda fuera', () => {
    // El gate corre typecheck, lint y test:unit — NO la suite de integracion,
    // que es la unica que ejercita renderer -> preload -> handler -> SQLite.
    expect(bloquea('src/infrastructure/ipc/graph-action-handlers.ts')).toBe(true)
    expect(bloquea('src/preload/repair-impl.ts')).toBe(true)
  })

  it('lo que guarda la clave y lo que construye el binario, fuera', () => {
    expect(bloquea('src/domain/settings/api-key-store.ts')).toBe(true)
    expect(bloquea('package.json')).toBe(true)
    expect(bloquea('electron-builder.yml')).toBe(true)
    expect(bloquea('install.sh')).toBe(true)
  })

  it('el tope de lineas corta a la decima, no a la undecima', () => {
    const chico = { severity: 'LOW', files: ['src/domain/repair/additive.ts'], insertions: 8, deletions: 1 } as const // prettier-ignore
    expect(evaluate(chico, politica()).allowed).toBe(true)
    expect(evaluate({ ...chico, deletions: 2 }, politica()).allowed).toBe(false)
  })
})
