import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/** El indicador del lote en el Terminal (ADR-088, arco 1), leido del FUENTE:
 *  los tests de este repo no pintan componentes. */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')
const CHAT = 'src/presentation/components/chat/'

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
    expect(fuente(`${CHAT}IndicadorDelLote.tsx`)).toContain('if (enCurso === null) return null')
  })

  it('cuenta hechos de total y nombra el freno', () => {
    const indicador = fuente(`${CHAT}IndicadorDelLote.tsx`)

    expect(indicador).toContain('{enCurso.hechos} de {enCurso.total}')
    expect(indicador).toContain('Detener lo corta')
  })
})
