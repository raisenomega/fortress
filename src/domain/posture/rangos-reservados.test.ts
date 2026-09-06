import { describe, expect, it } from 'vitest'
import { isPrivateHost } from './private-host'
import { CUANTOS_BLOQUES, esReservada } from './rangos-reservados'

/** Los que la cadena de `if` anterior NO cubria, con su nombre. */
const FALTABAN: readonly (readonly [string, string])[] = [
  ['100.64.0.1', 'CGNAT del operador (RFC 6598)'],
  ['100.127.255.254', 'CGNAT, el otro extremo del /10'],
  ['192.0.0.8', 'asignaciones del IETF (RFC 6890)'],
  ['192.0.2.5', 'TEST-NET-1'],
  ['192.88.99.1', 'relay 6to4 retirado'],
  ['198.18.0.1', 'banco de pruebas (RFC 2544)'],
  ['198.19.255.255', 'banco de pruebas, el otro extremo del /15'],
  ['198.51.100.7', 'TEST-NET-2'],
  ['203.0.113.7', 'TEST-NET-3'],
  ['224.0.0.1', 'multicast'],
  ['239.255.255.250', 'multicast, SSDP'],
  ['240.0.0.1', 'reservado'],
  ['255.255.255.255', 'difusion']
]

/** Y los que ya cubria: el arreglo no puede haberlos perdido. */
const YA_ESTABAN = ['0.0.0.0', '10.1.2.3', '127.0.0.1', '169.254.169.254', '172.20.0.1', '192.168.1.1'] // prettier-ignore

const PUBLICAS = ['8.8.8.8', '1.1.1.1', '93.184.216.34', '100.63.255.255', '100.128.0.0', '198.17.255.255', '223.255.255.255'] // prettier-ignore

describe('los rangos reservados salen de una tabla, no de una cadena de ifs', () => {
  it.each(FALTABAN)('%s es reservada — %s', (ip) => {
    expect(esReservada(ip)).toBe(true)
  })

  it.each(YA_ESTABAN)('%s sigue siendo reservada', (ip) => {
    expect(esReservada(ip)).toBe(true)
  })

  it.each(PUBLICAS)('%s NO se clasifica de mas', (ip) => {
    // Los tres ultimos son los VECINOS de un bloque: 100.63 y 100.128 rodean
    // CGNAT, 198.17 el banco de pruebas. Una mascara mal calculada los tragaria.
    expect(esReservada(ip)).toBe(false)
  })

  it('la tabla no encoge sin que nadie se entere', () => {
    expect(CUANTOS_BLOQUES).toBeGreaterThanOrEqual(15)
  })
})

describe('el nombre local, tambien en su forma absoluta', () => {
  it.each(['localhost.', 'LOCALHOST.', 'impresora.local.', 'a.b.local'])(
    '%s es privado pese al punto final',
    (host) => {
      // El DNS resuelve `localhost.` igual que `localhost`, y `new URL` conserva
      // el punto: el patron anclado no casaba y el filtro se esquivaba tecleandolo.
      expect(isPrivateHost(host)).toBe(true)
    }
  )

  it.each(['app.localhost', 'localhost'])('%s tambien (RFC 6761)', (host) => {
    expect(isPrivateHost(host)).toBe(true)
  })

  it.each(['milocalhost.com', 'local.example.com', 'localhost.attacker.com'])(
    '%s NO es privado: el ancla sigue puesta',
    (host) => {
      expect(isPrivateHost(host)).toBe(false)
    }
  )
})
