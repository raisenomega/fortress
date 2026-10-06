import assert from 'node:assert/strict'
import { test } from 'node:test'
import { BUDGET_FLAG, DEFAULT_PER_RUN } from '../src/domain/settings/run-budget.ts'
import { argumentosDelAgente, topeDelAgente } from './fase-b-agente.ts'

// Una base de mentira: los ajustes del operador y el gasto de hoy en agent_runs.
type Base = Parameters<typeof topeDelAgente>[0]
const base = (ajustes: Record<string, string>, hoy: number): Base => ({
  prepare: (sql) => ({
    get: (k) => (sql.includes('agent_runs') ? { usd: hoy } : { value: ajustes[String(k)] })
  })
})

test('el tope configurado por el operador es el que viaja al flag, no el de por defecto', () => {
  const tope = topeDelAgente(base({ budget_per_run_usd: '0.5', budget_per_day_usd: '10' }, 0))
  const args = argumentosDelAgente('hola', tope)
  assert.equal(args[args.indexOf(BUDGET_FLAG) + 1], '0.5')
})

test('con el diario agotado no se lanza: corta con el mensaje del tope', () => {
  const agotada = base({ budget_per_run_usd: '3', budget_per_day_usd: '2' }, 2.5)
  assert.throws(() => topeDelAgente(agotada), /Tope diario alcanzado/)
})

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

// El CRITICAL 351abcd1 en esta sede: sin el par, el CLI carga el
// `.claude/settings.json` del repo auditado y sus hooks corren FUERA de la caja.
test('sin confianza, SOLO las fuentes del operador: los settings del repo no cargan', () => {
  const args = argumentosDelAgente('hola')
  assert.equal(args[args.indexOf('--setting-sources') + 1], 'user')
})

test('con confianza, las de proyecto cargan A PROPOSITO: el par no viaja', () => {
  assert.ok(!argumentosDelAgente('hola', DEFAULT_PER_RUN, true).includes('--setting-sources'))
})

// El cerco MCP (medir-deriva.test.ts): el flag estricto sin --mcp-config cierra
// el conjunto a vacio, para que el hijo no monte los servidores del operador.
test('cierra el conjunto MCP: --strict-mcp-config viaja y sin servidor alguno', () => {
  const args = argumentosDelAgente('hola')
  assert.ok(args.includes('--strict-mcp-config'))
  assert.ok(!args.includes('--mcp-config'))
})
