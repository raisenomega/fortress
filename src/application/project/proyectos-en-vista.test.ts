import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { AppContext } from '../context'
import { proyectosEnVista } from './proyectos-en-vista'

const FORTRESS = { id: 'f', name: 'FORTRESS', path: '/fortress', trusted: true } as Project
const CLIENTE = { id: 'c', name: 'Cliente', path: '/cliente', trusted: true } as Project
const SIN_GIT = { id: 's', name: 'Sin git', path: '/sin-git', trusted: true } as Project
const AJENO = { id: 'a', name: 'Ajeno', path: '/ajeno', trusted: false } as Project

const context = {
  projects: { list: () => [FORTRESS, CLIENTE, SIN_GIT, AJENO] }
} as unknown as AppContext
const sondas = {
  esRepoPropio: (path: string) => path === '/fortress',
  redGit: (path: string) => path !== '/sin-git'
}

const resoluble = (id: string): boolean | undefined =>
  proyectosEnVista(context, sondas).find((p) => p.id === id)?.resoluble

describe('la lista del renderer lleva `resoluble`, calculado en el proceso principal', () => {
  it('el repo propio de FORTRESS, de confianza y con git: false (la casilla nunca sale ahi)', () => {
    expect(resoluble('f')).toBe(false)
  })

  it('un cliente de confianza, no propio y con red git: true', () => {
    expect(resoluble('c')).toBe(true)
  })

  it('de confianza pero sin red git: false', () => {
    expect(resoluble('s')).toBe(false)
  })

  it('sin confianza: false', () => {
    expect(resoluble('a')).toBe(false)
  })

  it('el resto del proyecto viaja intacto', () => {
    const cliente = proyectosEnVista(context, sondas).find((p) => p.id === 'c')
    expect(cliente).toMatchObject({ id: 'c', name: 'Cliente', path: '/cliente', trusted: true })
  })
})
