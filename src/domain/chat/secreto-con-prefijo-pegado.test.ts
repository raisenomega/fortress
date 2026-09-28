import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/**
 * Los que escapaban, medidos uno a uno el 2026-09-28. Todos por la misma causa:
 * el prefijo va PEGADO a la palabra y la condicion de la letra los dejaba pasar.
 * `PGPASSWORD` es la variable que documenta Postgres, no un caso de laboratorio.
 */
const ESCAPABAN = [
  'PGPASSWORD=hunter2', 'MYSQLPASSWORD=x', 'REDISPASSWORD=x', 'SMTPPASSWORD=x', 'DBPASSWORD=x',
  'ADMINPASSWORD=x', 'MYPASSWORD=x', 'XPASSWORD=x', 'GITHUBTOKEN=x', 'SLACKTOKEN=x', 'APITOKEN=x',
  'AWSSECRET=x', 'MYKEY=x',
  // Y los seis que el primer arreglo aun dejaba pasar: un mutante vivo los delato.
  'myPASSWORD=x', 'pgPASSWORD=x', 'mypassword=x', 'dbPassword=x', 'authToken=x', 'myApiKey=x',
  'myKEY=x', 'dbKEY=x', 'myPWD=x'
] // prettier-ignore

/** La familia de `key`: ocho palabras que la acaban. Sin la condicion de la letra
 *  se tachaban todas, y un comando tachado entero no se puede auditar. */
const PALABRAS = [
  'el monkey=banana del zoo', 'donkey=burro', 'turkey: pavo', 'ver el keyboard=usb',
  'turnkey=solution', 'lowkey=vibe', 'hockey=deporte', 'whiskey=bebida', 'jockey=jinete',
  'Monkey=chimp', 'myMonkey=chimp', 'theTurkey=pavo', 'myTurkey=pavo'
] // prettier-ignore

/** Palabras que EMPIEZAN por la palabra larga: la salva exigir el `=` pegado. */
const PREFIJOS = ['secretaria=ana', 'secreto=x', 'tokenizer=x', 'passwordless=x', 'tokens=100']

describe('el prefijo PEGADO ya no deja escapar el secreto', () => {
  it.each(ESCAPABAN)('%s se tacha', (linea) => {
    expect(redactSecrets(linea)).not.toContain(linea.split('=')[1])
  })
})

describe('y el texto legitimo sigue intacto', () => {
  it.each([...PALABRAS, ...PREFIJOS])('%s queda igual', (texto) => {
    expect(redactSecrets(texto)).toBe(texto)
  })

  it('los DOS falsos positivos medidos, aceptados a proposito', () => {
    // `betoken` acaba en `token` con el `=` pegado: palabra arcaica inglesa.
    expect(redactSecrets('betoken=algo')).toBe('be***')
    // Y la palabra del diccionario escrita ENTERA en mayusculas, que tiene la
    // MISMA forma que `MYKEY=`: no hay manera de separarlas. Se elige este lado
    // porque tachar de mas cuesta legibilidad y no tachar cuesta una credencial.
    expect(redactSecrets('MONKEY=banana')).toBe('***')
    expect(redactSecrets('TURKEY=pavo')).toBe('***')
  })
})
