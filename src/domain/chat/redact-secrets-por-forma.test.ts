import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

// Armados por TROZOS a proposito: escritos de corrido, un escaner de secretos
// —el de FORTRESS incluido— los tomaria por credenciales reales en el repo.
const pem = (clase: string, cuerpo: string): string =>
  [`-----BEGIN ${clase}`, ` KEY-----\n${cuerpo}\n-----END ${clase}`, ' KEY-----'].join('')
const B64 = 'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKj'
const CUERPO = [B64, B64.split('').reverse().join(''), 'Zm9ydHJlc3M='].join('\n')
const JWT = ['eyJhbGciOiJIUzI1NiJ9', 'eyJzdWIiOiIxMjM0NTY3ODkwIn0', 'SflKxwRJSMeKKF2QT4fwpMeJf36P'].join('.') // prettier-ignore

/** Se reconocen por su FORMA: viajan sin nombre en un log o en la salida de un
 *  agente. Medido el 2026-09-20: los seis pasaban enteros. */
const ESCAPABAN: ReadonlyArray<readonly [string, string, string]> = [
  ['AWS access key', `aws configure set ${'AKIA'}IOSFODNN7EXAMPLE ok`, 'IOSFODNN7EXAMPLE'],
  ['AWS temporal', `id=${'ASIA'}Y34FZKBOKMUTVV7A`, 'Y34FZKBOKMUTVV7A'],
  ['Slack bot', `token ${'xoxb'}-1234567890-abcdefghijkl fin`, '1234567890-abcdefghijkl'],
  ['Slack usuario', `${'xoxp'}-9876543210-zyxwvutsrqpo`, '9876543210-zyxwvutsrqpo'],
  ['JWT', `cookie: sesion=${JWT}; path=/`, 'SflKxwRJSMeKKF2QT4fwpMeJf36P'],
  ['PEM RSA', `cat id_rsa\n${pem('RSA PRIVATE', CUERPO)}\nlisto`, B64],
  ['PEM OpenSSH', pem('OPENSSH PRIVATE', CUERPO), B64],
  ['PEM PKCS8', pem('PRIVATE', CUERPO), B64]
]

describe('redactSecrets tacha por la FORMA del valor', () => {
  it.each(ESCAPABAN)('%s ya no escapa', (_clase, texto, rastro) => {
    expect(redactSecrets(texto)).not.toContain(rastro)
  })

  it('el PEM se lleva SU bloque y nada mas: lo de alrededor se sigue leyendo', () => {
    const salida = redactSecrets(`antes\n${pem('RSA PRIVATE', CUERPO)}\ndespues del log`)

    expect(salida).toContain('antes')
    expect(salida).toContain('despues del log')
  })

  it('un PEM sin su END tambien se tacha: el cuerpo es el secreto, no el pie', () => {
    const truncado = `-----BEGIN ${'RSA PRIVATE'} KEY-----\n${CUERPO}\n[corte del log]`

    expect(redactSecrets(truncado)).not.toContain(B64)
    expect(redactSecrets(truncado)).toContain('[corte del log]')
  })
})

/** Tachar de mas deja un texto que no se puede auditar, que es su propio fallo. */
const LEGITIMO = [
  '-----BEGIN CERTIFICATE-----\nMIIDdzCCAl+gAwIBAgIEAgAAuTANBgkq\n-----END CERTIFICATE-----',
  '-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcD\n-----END PUBLIC KEY-----',
  'eyJhbGciOiJIUzI1NiJ9 es solo una cabecera, sin carga ni firma',
  'eyJhbGciOiJIUzI1NiJ9.dos-segmentos-no-son-un-jwt',
  'xoxo-besos-y-abrazos-para-todos',
  'el parametro TAKIAMOTOSANXYZ123456 no es de AWS',
  'AKIA corto',
  "grep -rn 'BEGIN' docs/"
]

describe('y NO tacha de mas', () => {
  it.each(LEGITIMO)('%s queda intacto', (texto) => {
    expect(redactSecrets(texto)).toBe(texto)
  })
})
