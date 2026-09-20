import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El indicador del lote en el Terminal (ADR-088, arco 1), leido del FUENTE:
 *  los tests de este repo no pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const CHAT = 'src/presentation/components/chat/'

/**
 * CONTRATO CORREGIDO (2026-09-20, la barra doble). Dos cosas cambian, y las dos
 * son correcciones, no roturas:
 *
 * 1. Contaba `hechos` EN CRUDO —«cuantos termine»— mientras el pie del hilo
 *    cuenta `hechos + 1` —«cual hago»—. El mismo lote decia «Lote 0 de 3» abajo
 *    y «Lote 1 de 3» arriba. Las dos eran ciertas y ninguna decia a que
 *    pregunta contestaba. Ahora las tres barras usan `etiquetaDelLote`.
 * 2. Salia en los DOS modos. En autonomo `LoteEnCurso` ya lo dice —y con la
 *    fase—, asi que aqui sobraba. Se queda SOLO en supervisado, donde el pie es
 *    la pildora y no lleva numeros.
 */
describe('mientras el lote corre, el Terminal dice por cual va', () => {
  it('el indicador se monta en el Terminal, encima del input', () => {
    const ventana = fuente(`${CHAT}ChatWindow.tsx`)

    expect(ventana).toMatch(/<IndicadorDelLote projectId=\{project\.id\} \/>\s*<ChatInput/)
  })

  it('lee el MISMO store que la barra del Escaneo: un solo dato', () => {
    expect(fuente(`${CHAT}IndicadorDelLote.tsx`)).toMatch(
      /useColaDelLoteStore\(\(s\) =>\s*s\.enCurso\?\.projectId === projectId \? s\.enCurso : null\s*\)/
    )
  })

  it('sin lote de ESE proyecto no pinta nada', () => {
    // La guarda de siempre, ahora compartiendo linea con la del modo.
    expect(fuente(`${CHAT}IndicadorDelLote.tsx`)).toMatch(/if \(enCurso === null \|\| autonomo\)/)
  })

  it('cuenta con el MISMO contador que el hilo, no con `hechos` en crudo', () => {
    const indicador = fuente(`${CHAT}IndicadorDelLote.tsx`)

    expect(indicador).toContain('etiquetaDelLote(enCurso.hechos, enCurso.total)')
    expect(indicador).not.toContain('{enCurso.hechos} de {enCurso.total}')
  })

  it('y sigue nombrando el freno: el texto no era el problema', () => {
    expect(fuente(`${CHAT}IndicadorDelLote.tsx`)).toContain('Detener lo corta')
  })

  it('SOLO EN SUPERVISADO: en autonomo lo dice el pie del hilo', () => {
    const indicador = fuente(`${CHAT}IndicadorDelLote.tsx`)

    expect(indicador).toMatch(/const autonomo = useSettingsStore/)
    expect(indicador).toContain('if (enCurso === null || autonomo) return null')
  })
})
