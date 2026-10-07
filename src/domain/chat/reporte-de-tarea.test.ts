import { describe, expect, it } from 'vitest'
import { EMPTY_USAGE } from '@domain/telemetry/token-usage'
import { reporteDeTarea, textoDelReporte, type ResultadoDelTurno } from './reporte-de-tarea'

/** PASO 87, el cable de dato: el CTO consume un RESULTADO estructurado, no
 *  prosa desperdigada. Se empaqueta lo que ya existe, nunca se inventa. */

const usage = { ...EMPTY_USAGE, costUsd: 0.42 }
const base: ResultadoDelTurno = {
  assistant: { content: 'Arreglado. La clave era {"apiKey":"***"} y quedo tachada.' },
  failed: false,
  edits: ['src/a.ts', 'src/b.ts'],
  sinCierre: null,
  sinVerificar: false,
  usage,
  modelo: 'claude-opus-5-5',
  hallazgos: 2
}

describe('el reporte de tarea empaqueta el turno terminado', () => {
  it('hecho: estado, que toco, verificacion, coste, modelo y hallazgos', () => {
    expect(reporteDeTarea(base)).toEqual({
      estado: 'hecho',
      resumen: base.assistant.content,
      edits: ['src/a.ts', 'src/b.ts'],
      verificacion: 'verificado',
      cierre: null,
      usage,
      modelo: 'claude-opus-5-5',
      hallazgos: 2
    })
  })

  it('fallido cuando failed, sin_verificar cuando nadie compilo, y sin modelo = null', () => {
    const r = reporteDeTarea({ ...base, failed: true, sinVerificar: true, modelo: undefined })
    expect(r.estado).toBe('fallido')
    expect(r.verificacion).toBe('sin_verificar')
    expect(r.modelo).toBeNull()
  })

  it('el TEXTO del reporte: cabecera de una linea y DEBAJO el resumen entero', () => {
    const texto = textoDelReporte(reporteDeTarea(base))
    const [cabecera, ...resto] = texto.split('\n')
    expect(cabecera).toContain('hecho')
    expect(cabecera).toContain('verificado')
    expect(cabecera).toContain('claude-opus-5-5')
    expect(cabecera).toContain('$0.42')
    expect(cabecera).toContain('hallazgos: 2')
    expect(resto.join('\n')).toContain(base.assistant.content)
  })

  it('HEREDA la redaccion: el resumen es el persistido tachado, nunca un crudo vecino', () => {
    const conCrudo = { ...base, textoCrudo: 'la clave era sk-ant-SECRETO' } as ResultadoDelTurno
    const r = reporteDeTarea(conCrudo)
    expect(r.resumen).toBe(base.assistant.content)
    expect(JSON.stringify(r)).not.toContain('sk-ant-SECRETO')
  })
})
