import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BUDGET_FLAG } from '../src/domain/settings/run-budget.ts'
import { argumentosDelCto, opcionesDelCto } from './cabecera-corrida.ts'

// Uso: node --import ./scripts/lib/cargar-ts.mjs --test scripts/cabecera-corrida.test.ts
// El arnes multiplica corridas opus: sin tope, una que se alarga solo la corta el timeout.
test('el tope del operador viaja al flag de gasto', () => {
  const args = argumentosDelCto(0.5)
  assert.equal(args[args.indexOf(BUDGET_FLAG) + 1], '0.5')
})

test('un tope de cero desactiva el limite, si el operador lo decide', () => {
  assert.ok(!argumentosDelCto(0).includes(BUDGET_FLAG))
})

test('el hijo no hereda la API key de la shell del operador', () => {
  const previa = process.env.ANTHROPIC_API_KEY
  process.env.ANTHROPIC_API_KEY = 'sk-de-la-shell'
  try {
    const env = opcionesDelCto('hola').env
    assert.ok(env !== undefined)
    assert.equal(env.ANTHROPIC_API_KEY, undefined)
  } finally {
    if (previa === undefined) delete process.env.ANTHROPIC_API_KEY
    else process.env.ANTHROPIC_API_KEY = previa
  }
})

test('el prompt sigue viajando por stdin, no como argumento', () => {
  assert.equal(opcionesDelCto('el prompt').input, 'el prompt')
  assert.ok(!argumentosDelCto(1).includes('el prompt'))
})
