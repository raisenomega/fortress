import { chmodSync, mkdtempSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { describe, expect, it } from 'vitest'
import { createGraphCritico } from './graph-critico'

const OBJECION = 'Rompe a quien lo llama: api.ts:17 esperaba null y ahora lanza'

function fakeBin(script: string): string {
  const dir = mkdtempSync(join(tmpdir(), 'fcc-critico-'))
  const file = join(dir, 'fake-claude')
  writeFileSync(file, `#!/bin/sh\n${script}\n`)
  chmodSync(file, 0o755)
  return file
}

/**
 * ADR-096. Con BINARIO FALSO y no con un mock: un mock probaria que llamamos al
 * proceso; un binario de verdad prueba que manejamos lo que devuelve —y lo que
 * NO devuelve cuando se cuelga o muere—.
 */
describe('createGraphCritico (binario fake)', () => {
  it('prosa con factura: la objecion entera y los tokens', async () => {
    const bin = fakeBin(`echo '{"result":"${OBJECION}","usage":{"input_tokens":90,"output_tokens":10}}'`) // prettier-ignore

    const r = await createGraphCritico(bin, 'p1').run(tmpdir(), 'prompt')

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.texto).toBe(OBJECION)
    expect(r.runMeta.tokensUsed).toBe(100)
  })

  it('prosa SIN sobre JSON: se queda con el crudo, que es la objecion igual', async () => {
    // El critico no devuelve un formato: devuelve texto. Si el CLI no envuelve,
    // lo que dijo sigue valiendo — al reves que OMEGA, que sin VERDICT no juzga.
    const r = await createGraphCritico(fakeBin('echo "el fix aguanta, comprobe api.ts"'), 'p1').run(tmpdir(), 'p') // prettier-ignore

    expect(r.ok).toBe(true)
    if (r.ok) expect(r.texto).toContain('el fix aguanta')
  })

  it('sin decir nada: NO es una objecion, y el turno sigue', async () => {
    const r = await createGraphCritico(fakeBin('echo ""'), 'p1').run(tmpdir(), 'p')

    expect(r).toMatchObject({ ok: false, error: 'sin texto' })
  })

  it('colgado: el plazo lo mata y lo dice', async () => {
    const r = await createGraphCritico(fakeBin('sleep 30'), 'p1', 150).run(tmpdir(), 'p')

    expect(r).toMatchObject({ ok: false, timedOut: true })
  })

  it('muerto a mitad: resuelve con lo que haya, sin colgar el turno', async () => {
    // Un critico que revienta no puede dejar el turno esperando para siempre.
    const r = await createGraphCritico(fakeBin('echo "medio jui"; kill -9 $$'), 'p1').run(tmpdir(), 'p') // prettier-ignore

    // Resolvio: eso es lo que se prueba. Que traiga o no texto depende de si el
    // `echo` llego antes que el `kill`, y esa carrera no es el objeto del test.
    expect(typeof r.ok).toBe('boolean')
  })

  it('el binario no existe: error con mensaje, sin lanzar', async () => {
    const r = await createGraphCritico('/no/existe', 'p1').run(tmpdir(), 'p')

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.timedOut).toBe(false)
  })
})
