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

  it('PARA en supervisado; en autonomo lo dispara el ADELANTE (ADR-097 §3)', () => {
    const plan = fuente('src/presentation/services/lote-por-enter.ts')
    const codigo = plan.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

    // Sin ADELANTE queda esperando el clic; con el, OMEGA ocupa esa silla.
    expect(codigo).toMatch(/if \(plan === 'ADELANTE'\) return resolverLotePendiente\(projectId\)/)
    expect(codigo).toMatch(/marcarPlaneado\(projectId, plan\)/)
    // La cola no se arranca desde aqui en ningun modo: la corre el resolvedor.
    expect(codigo).not.toMatch(/correrLote/)
    // Y va SIEMPRE en solo lectura, aunque el proyecto corra en autonomo.
    expect(codigo).toMatch(/mode: 'supervisado'/)
    // El punto de parada ya no PROMETE a OMEGA: lo nombra sentado.
    expect(plan).toContain('PUNTO DE PARADA')
    expect(plan).not.toMatch(/PIEZA 5 sera OMEGA/)
    expect(plan).toMatch(/en AUTONOMO es OMEGA/)
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
