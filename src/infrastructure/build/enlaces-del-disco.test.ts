import { describe, expect, it } from 'vitest'
import { homedir } from 'node:os'
import { admiteEnlaces } from './enlaces-del-disco'

describe('la sonda del disco: si admite los enlaces que npm necesita', () => {
  it('el HOME (ext4 en esta maquina) los admite', () => {
    expect(admiteEnlaces(homedir())).toBe(true)
  })

  it('una ruta que no existe no decide nada: se contesta que si', () => {
    expect(admiteEnlaces('/nonexistent/proyecto')).toBe(true)
  })
})
