import { describe, expect, it } from 'vitest'
import { redactSecrets } from './tool-detail'

/**
 * La credencial que no lleva su nombre al lado: la delata el SITIO donde esta.
 * Medido el 2026-09-28: estas formas escapaban enteras en cuanto el valor no era
 * una tirada de 32 hexadecimales, porque lo unico que las tapaba era el comodin
 * del hash — por accidente, no por diseno.
 */
const SECRETOS: readonly (readonly [string, string])[] = [
  ['curl -u api:hunter2 https://x', 'hunter2'],
  ['psql "postgresql://u:hunter2@h/db"', 'hunter2'],
  ['mongodb+srv://u:p4ss@c/db', 'p4ss'],
  ['redis://:clave@h:6379', 'clave'],
  ['Authorization: abc123xyz789', 'abc123xyz789'],
  ['Authorization: Bearer tok_secreto', 'tok_secreto'],
  ['curl --password=s3cr3t x', 's3cr3t'],
  ['curl --token abc123 x', 'abc123']
]

/** Comandos que el agente auditor corre a diario. Uno tachado no se puede leer. */
const REALES = [
  'find . -name "*.ts" -print', 'find src -path x -prune', 'find . -perm 644',
  'rsync -a --progress a b', 'npm run build -- --prod', 'docker run -p 8080:80 img',
  'ssh -p 2222 host', 'psql -p 5432 -h localhost', 'curl https://api.example.com/v1',
  'git log --pretty=oneline', 'tar -xzpf a.tgz', 'ver https://github.com/raisenomega/fortress',
  'clonar git@github.com:raisen/x.git'
] // prettier-ignore

describe('la credencial se tacha por el SITIO, no solo por su nombre', () => {
  it.each(SECRETOS)('%s no deja rastro', (linea, rastro) => {
    expect(redactSecrets(linea)).not.toContain(rastro)
  })

  it('y la linea sigue LEGIBLE: se conserva el usuario y la arroba', () => {
    // No se puede auditar lo que no se ve: el usuario no es secreto y la forma
    // de la orden es justo lo que el operador necesita reconocer.
    expect(redactSecrets('curl -u api:hunter2 https://x')).toBe('curl -u api:*** https://x')
    expect(redactSecrets('psql "postgresql://u:hunter2@h/db"')).toBe('psql "postgresql://u:***@h/db"')
  })
})

describe('y ningun comando de trabajo se destroza', () => {
  it.each(REALES)('%s queda igual', (texto) => {
    expect(redactSecrets(texto)).toBe(texto)
  })
})
