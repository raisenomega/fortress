/**
 * Proyecto deliberadamente vulnerable, generado en /tmp. Sirve para comprobar
 * que el escaner encuentra de verdad lo que dice encontrar, en vez de creerle.
 *
 * La clave se compone en runtime: asi el fixture tiene un secreto que hallar
 * sin que este repositorio guarde nada con forma de credencial.
 */
const { mkdirSync, mkdtempSync, rmSync, writeFileSync } = require('fs')
const { join } = require('path')
const { tmpdir } = require('os')

const FAKE_KEY = ['sk', 'ant', 'api03', 'clave-inventada-para-la-prueba'].join('-')

const CONFIG = `// Configuracion de la aplicacion
const API_KEY = "${FAKE_KEY}"

module.exports = { API_KEY }
`

const DB = `// Consulta construida concatenando input del usuario
function getUser(db, id) {
  return db.query("SELECT * FROM users WHERE id = " + id)
}

module.exports = { getUser }
`

function createVulnerableFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'fortress-vulnerable-'))

  mkdirSync(join(dir, 'src'))
  writeFileSync(join(dir, 'src', 'config.js'), CONFIG)
  writeFileSync(join(dir, 'src', 'db.js'), DB)
  writeFileSync(join(dir, 'package.json'), '{ "name": "vulnerable", "version": "1.0.0" }\n')

  return dir
}

function removeFixture(dir) {
  rmSync(dir, { recursive: true, force: true })
}

module.exports = { createVulnerableFixture, removeFixture }
