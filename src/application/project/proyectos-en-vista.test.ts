import { describe, expect, it } from 'vitest'
import type { Project } from '@domain/project/project'
import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'
import type { AppContext } from '../context'
import { proyectosEnVista } from './proyectos-en-vista'

const FORTRESS = { id: 'f', name: 'FORTRESS', path: '/fortress', trusted: true } as Project
const CLIENTE = { id: 'c', name: 'Cliente', path: '/cliente', trusted: true } as Project
const SIN_GIT = { id: 's', name: 'Sin git', path: '/sin-git', trusted: true } as Project
const AJENO = { id: 'a', name: 'Ajeno', path: '/ajeno', trusted: false } as Project

const context = {
  projects: { list: () => [FORTRESS, CLIENTE, SIN_GIT, AJENO] },
  settings: { get: () => 'autonomo' }
} as unknown as AppContext
const sondas = {
  esRepoPropio: (path: string) => path === '/fortress',
  redGit: (path: string) => path !== '/sin-git'
}

const buscar = (id: string): ProyectoEnVista | undefined =>
  proyectosEnVista(context, sondas).find((p) => p.id === id)
const resoluble = (id: string): boolean | undefined => buscar(id)?.resoluble

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

describe('tambien lleva el EFECTO del toggle (reuso del modo persistido)', () => {
  it('cliente sano en autonomo: no degrada', () => {
    expect(buscar('c')?.efecto).toEqual({ modoEfectivo: 'autonomo', causa: null })
  })

  it('cada degradacion reporta su causa por categoria', () => {
    expect(buscar('a')?.efecto.causa).toBe('sinConfianza')
    expect(buscar('f')?.efecto.causa).toBe('repoPropio')
    expect(buscar('s')?.efecto.causa).toBe('gitNoListo')
  })
})
