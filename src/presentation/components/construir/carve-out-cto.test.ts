import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { esModoSinRepo } from '@domain/chat/hilo-de-chat'
import { parDeLaVista } from '../../services/rehidratar-el-hilo'

/** PASO 133: el carve-out de la vista gana 'cto' — y SOLO 'cto'. */

describe('CARVE-OUT ABRE AL CTO: global, sin proyecto, como el libre', () => {
  it('cto y libre son modos SIN repo: el gate de la vista no los bloquea', () => {
    expect(esModoSinRepo('cto')).toBe(true)
    expect(esModoSinRepo('libre')).toBe(true)
  })

  it('el par de la vista en cto es GLOBAL: proyecto NULL aunque haya uno elegido', () => {
    expect(parDeLaVista('p1', 'cto')).toEqual({ projectId: null, modo: 'cto' })
    expect(parDeLaVista(null, 'cto')).toEqual({ projectId: null, modo: 'cto' })
  })

  it('la vista usa el predicado del dominio (pin a la invocacion)', () => {
    const vista = readFileSync('src/presentation/components/construir/ConstruirView.tsx', 'utf8')
    expect(vista).toContain('esModoSinRepo(mode)')
    expect(vista).toContain('<CuerpoDelChat')
  })
})

describe('EL GATE SIGUE DE PIE: los modos de trabajo exigen proyecto+confianza', () => {
  it('plan, investigacion y ejecutor NO son modos sin repo', () => {
    for (const modo of ['plan', 'investigacion', 'ejecutor', 'terminal'] as const)
      expect(esModoSinRepo(modo)).toBe(false)
  })

  it('su par de vista conserva el proyecto: nada se filtro', () => {
    expect(parDeLaVista('p1', 'plan')).toEqual({ projectId: 'p1', modo: 'plan' })
    expect(parDeLaVista('p1', 'ejecutor')).toEqual({ projectId: 'p1', modo: 'ejecutor' })
  })

  it('la guarda de confianza de CuerpoDelChat sigue EXACTA (pin)', () => {
    const cuerpo = readFileSync('src/presentation/components/construir/CuerpoDelChat.tsx', 'utf8')
    expect(cuerpo).toContain('!libre')
    expect(cuerpo).toContain('!project.trusted')
  })
})
