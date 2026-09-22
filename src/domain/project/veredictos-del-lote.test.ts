import { describe, expect, it } from 'vitest'
import { veredictosDelLote, type ZombiAJuzgar } from './veredictos-del-lote'

const z = (over: Partial<ZombiAJuzgar> = {}): ZombiAJuzgar => ({
  id: 'z1', file: 'a/index.ts', line: 10, title: 't', severity: 'LOW', identity: 'LOW|a/index.ts|t', ...over
}) // prettier-ignore
const contenido = (texto: string | null) => (): string | null => texto
const REAL = { id: 'z1', status: 'REAL', tipo: 'relay-abierto', simbolo: 'handler', razon: 'sigue' }

describe('veredictosDelLote: nada muere sin prueba en el fichero de HOY', () => {
  it('OBSOLETO con marcador probado ausente: EXTINGUIDA, y dice con que marcador', () => {
    const [v] = veredictosDelLote([z()], [{ id: 'z1', status: 'OBSOLETO', tipo: 'relay-abierto', evidencia: { marcador: 'execFile(', forma: 'ausente' } }], contenido('const x = spawn()')) // prettier-ignore
    expect(v.desenlace).toBe('extinguida')
    expect(v.desenlace === 'extinguida' && v.motivo).toContain('execFile(')
  })

  it('OBSOLETO cuyo marcador sigue ahi: SIN PRUEBA, mitigada con nota, NUNCA extinguida', () => {
    const [v] = veredictosDelLote([z()], [{ id: 'z1', status: 'OBSOLETO', tipo: 'relay-abierto', evidencia: { marcador: 'execFile(', forma: 'ausente' } }], contenido('execFile(x)')) // prettier-ignore
    expect(v.desenlace).toBe('sin_prueba')
    expect(v.desenlace === 'sin_prueba' && v.nota).toMatch(/sin prueba/)
  })

  it('OBSOLETO sin evidencia, o con el fichero ilegible: SIN PRUEBA', () => {
    const [a] = veredictosDelLote(
      [z()],
      [{ id: 'z1', status: 'OBSOLETO', tipo: 'relay-abierto' }],
      contenido('x')
    )
    const [b] = veredictosDelLote([z()], [{ id: 'z1', status: 'OBSOLETO', tipo: 'relay-abierto', evidencia: { marcador: 'x', forma: 'ausente' } }], contenido(null)) // prettier-ignore
    expect([a.desenlace, b.desenlace]).toEqual(['sin_prueba', 'sin_prueba'])
  })

  it('REAL: sigue viva, con su tipo y su identidad de hoy — deja de ser identidad vieja', () => {
    const [v] = veredictosDelLote([z()], [REAL], contenido('x'))
    expect(v).toMatchObject({ desenlace: 'real', tipo: 'relay-abierto', simbolo: 'handler', identidad_nueva: 'a/index.ts|10|relay-abierto' }) // prettier-ignore
  })

  it('la que queda sin prueba tambien recibe identidad y tipo de hoy: no se queda zombi', () => {
    const [v] = veredictosDelLote(
      [z()],
      [{ id: 'z1', status: 'OBSOLETO', tipo: 'relay-abierto' }],
      contenido('x')
    )
    expect(v.desenlace === 'sin_prueba' && v.identidad_nueva).toBe('a/index.ts|10|relay-abierto')
  })

  it('sin respuesta, o con un status que no es REAL ni OBSOLETO: SIN DECIDIR, no se escribe', () => {
    const [a, b] = veredictosDelLote([z(), z({ id: 'z2' })], [{ id: 'z2', status: 'QUIZAS', tipo: 'relay-abierto' }], contenido('x')) // prettier-ignore
    expect([a.desenlace, b.desenlace]).toEqual(['sin_decidir', 'sin_decidir'])
  })

  it('un tipo fuera del vocabulario cae a otro y queda anotado', () => {
    const [v] = veredictosDelLote([z()], [{ ...REAL, tipo: 'inventado' }], contenido('x'))
    expect(v.desenlace === 'real' && v.tipo).toBe('otro')
    expect(v.desenlace === 'real' && v.nota).toContain('inventado')
  })
})
