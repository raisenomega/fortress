import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El lote (ADR-088) leido del FUENTE, como sus hermanos: no se pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const SCAN = 'src/presentation/components/scan/'

describe('el lote es UN gesto: precarga, y el Enter del operador lo manda', () => {
  it('la barra tiene UN gesto: pedir el plan. Aprobar ya no se hace aqui', () => {
    const barra = fuente(`${SCAN}BarraDelLote.tsx`)

    expect(barra).toMatch(/onClick=\{lote\.preparar\}/)
    expect(barra).not.toMatch(/Ejecutar plan|Aprobar plan/)
    // Lo DICE, pero no lo ofrece: la firma vive al pie del plan, en el Terminal.
    expect(barra).toContain('Lee el plan en el Terminal')
  })

  it('sin leyendas que abrumen: ni costes, ni minutos, ni «sin preguntar»', () => {
    // Lo que el cliente LEE, sin los comentarios del codigo.
    const barra = fuente(`${SCAN}BarraDelLote.tsx`)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')

    expect(barra).not.toMatch(/editara sin volver a preguntar|\$\d|minutos|agentes|coste/)
  })
})

describe('el turno de plan para, y el segundo gesto ejecuta', () => {
  it('con un lote precargado, el Enter NO pasa por la plan-card', () => {
    const puerta = fuente('src/presentation/services/puerta-del-envio.ts')

    expect(puerta).toMatch(
      /if \(envio\.projectId !== null && lotePendienteDe\(envio\.projectId\)\) \{\s*void planDelLote\(/
    )
  })

  it('el turno de plan PARA: manda el mensaje y NO arranca la cola', () => {
    const plan = fuente('src/presentation/services/lote-por-enter.ts')
    // El CODIGO, sin los comentarios (que si nombran a quien disparara luego).
    const codigo = plan.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    expect(codigo).toMatch(
      /await sendMessage\(\{ projectId, prompt, mode: 'supervisado', excludedAgents \}\)\s*useColaDelLoteStore\.getState\(\)\.marcarPlaneado\(projectId\)/
    )
    expect(codigo).not.toMatch(/correrLote|resolverLotePendiente/)
  })

  it('y va SIEMPRE en solo lectura, aunque el proyecto corra en autonomo', () => {
    expect(fuente('src/presentation/services/lote-por-enter.ts')).toMatch(/mode: 'supervisado'/)
  })

  it('el punto de parada deja escrito donde entra OMEGA en la pieza 5', () => {
    expect(fuente('src/presentation/services/lote-por-enter.ts')).toContain('PUNTO DE PARADA')
    expect(fuente('src/presentation/services/lote-por-enter.ts')).toMatch(/PIEZA 5 sera OMEGA/)
  })

  it('al aprobar ya no se escribe ningun aviso largo en el chat', () => {
    const servicio = fuente('src/presentation/services/resolver-lote-en-terminal.ts')

    expect(servicio).not.toMatch(/avisoDeAprobacion/)
  })

  it('la barra ya NO manda a supervisado: el lote corre en los dos modos', () => {
    // ADR-090, A.1c. El boton estaba `disabled` en autonomo y la barra lo
    // explicaba; se pulsaba y no pasaba nada, que es como se vivia el candado.
    const barra = fuente(`${SCAN}BarraDelLote.tsx`)

    expect(barra).not.toContain('El lote resuelve en modo Supervisado')
    expect(barra).not.toContain('enAutonomo')
    expect(fuente('src/presentation/services/preparar-lote.ts')).not.toMatch(
      /notify|AVISO_AUTONOMO/
    )
  })
})
