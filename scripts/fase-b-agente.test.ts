import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BUDGET_FLAG, DEFAULT_PER_RUN } from '../src/domain/settings/run-budget.ts'
import { argumentosDelAgente } from './fase-b-agente.ts'

// Uso: node --import ./scripts/lib/cargar-ts.mjs --test scripts/fase-b-agente.test.ts
// El contrato es el de buildArgs (claude-cli.test.ts): el tope viaja con su
// valor y cero lo desactiva. Sin el, un lote de N hallazgos gasta sin techo.
test('el tope de gasto viaja por defecto con el valor medido', () => {
  const args = argumentosDelAgente('hola')
  assert.equal(args[args.indexOf(BUDGET_FLAG) + 1], String(DEFAULT_PER_RUN))
})

test('un tope de cero desactiva el limite, si el operador lo decide', () => {
  assert.ok(!argumentosDelAgente('hola', 0).includes(BUDGET_FLAG))
})

test('el prompt sigue justo despues de -p, en modo plan', () => {
  const args = argumentosDelAgente('clasifica el hallazgo')
  assert.equal(args[args.indexOf('-p') + 1], 'clasifica el hallazgo')
  assert.equal(args[args.indexOf('--permission-mode') + 1], 'plan')
})
