import { describe, expect, it } from 'vitest'
import { claseDelFallo } from './clase-del-fallo'

const con = (name: string, extra: object = {}): unknown =>
  Object.assign(new Error('da igual el mensaje'), { name }, extra)

describe('la clase del fallo es el dato duro, no el mensaje', () => {
  it.each([
    ['TypeError', 'TypeError'],
    ['RangeError', 'RangeError'],
    ['SqliteError', 'SqliteError']
  ])('%s viaja tal cual', (name, espera) => {
    expect(claseDelFallo(con(name))).toBe(espera)
  })

  it('el codigo del sistema se suma cuando lo hay', () => {
    expect(claseDelFallo(con('Error', { code: 'ENOENT' }))).toBe('Error, ENOENT')
    expect(claseDelFallo(con('SqliteError', { code: 'SQLITE_BUSY' }))).toBe('SqliteError, SQLITE_BUSY') // prettier-ignore
  })

  it('y la clase transitoria, que es lo que salva a un `Error` a secas', () => {
    // Un fallo de red llega como Error sin codigo: sin este eje la nota diria
    // solo «Error», que no explica nada y no sirve para priorizar.
    const red = Object.assign(new Error('ENOTFOUND api.anthropic.com'), { name: 'Error' })
    expect(claseDelFallo(red)).toBe('Error, red o timeout')
  })
})

describe('y nada que no sea una clase o un codigo entra', () => {
  it.each([
    ['un nombre kilometrico', con('muy'.repeat(40))],
    ['un nombre con un punto, que puede ser un dato', con('pacientes.dni')],
    ['un nombre con un espacio', con('no es una clase')],
    ['una cadena tirada en vez de un Error', 'algo se rompio en /home/cliente'],
    ['un objeto sin nombre', { message: 'x' }],
    ['nulo', null]
  ])('%s cae al centinela', (_caso, valor) => {
    expect(claseDelFallo(valor)).toBe('desconocido')
  })

  it('un codigo que parece un dato del cliente NO se suma', () => {
    // El cerco por construccion: MAYUSCULAS y nada mas. `pacientes.dni` no pasa.
    expect(claseDelFallo(con('Error', { code: 'pacientes.dni' }))).toBe('Error')
    expect(claseDelFallo(con('SqliteError', { code: 'admin@clinica.es' }))).toBe('SqliteError')
  })
})
