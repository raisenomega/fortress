import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { banco } from './cola-del-lote-fixture'
import { correrLote } from './cola-del-lote'

const fuente = (ruta: string): string => readFileSync(ruta, 'utf8')
const IDS = ['f1', 'f2', 'f3'] as const

/**
 * ADR-090, Fase A.1c: caen los TRES candados que dejaban el lote muerto en
 * autonomo. No eran un aviso: el boton salia pintado y `disabled`, se pulsaba y
 * no pasaba nada — la barra lo explicaba en una linea que nadie relacionaba con
 * el clic muerto. Estaban puestos porque el lote no tenia quien juzgara lo que
 * dejaba escrito; con la Fase A.1b cada turno pasa por OMEGA antes de conservar
 * y reintenta hasta converger, asi que el motivo se fue.
 *
 * Los tres se prueban por FUENTE y no por render: lo que fallaba era que la
 * condicion existiera, y una condicion se ve leyendola.
 */
describe('los tres candados del lote en autonomo, retirados', () => {
  it('1) preparar-lote ya no corta por modo, y no le queda el import', () => {
    const s = fuente('src/presentation/services/preparar-lote.ts')

    expect(s).not.toMatch(/mode === 'autonomo'/)
    expect(s).not.toContain('settings-store')
  })

  it('2) la cola ya no consulta el modo: el puerto entero se fue', () => {
    const cola = fuente('src/presentation/services/cola-del-lote.ts')

    expect(cola).not.toMatch(/p\.modo\(\)/)
    expect(cola).not.toContain('readonly modo')
    // Y no se queda de adorno en quien la monta: un puerto sin lector es deuda.
    expect(fuente('src/presentation/services/resolver-lote-en-terminal.ts')).not.toMatch(/modo:/)
  })

  it('3) el boton de la barra ya no nace deshabilitado en autonomo', () => {
    const barra = fuente('src/presentation/components/scan/BarraDelLote.tsx')

    expect(barra).toContain('disabled={corriendo || lote.pendiente}')
    expect(barra).not.toContain('enAutonomo')
    // El hook tampoco lo calcula ya: nadie lo lee.
    expect(fuente('src/presentation/hooks/useLoteDelTablero.ts')).not.toContain('enAutonomo')
  })

  it('y la cola corre de punta a punta sin mirar el modo ni una vez', async () => {
    const b = banco({})

    const desenlaces = await correrLote('p1', IDS, b.p)

    expect(b.enviados.map((i) => i.findingId)).toEqual(IDS)
    expect(desenlaces).not.toBeNull()
  })

  it('lo que NO cae: con un turno en marcha sigue sin arrancar', () => {
    // El carril del proyecto es uno. Ese no era un candado del modo.
    expect(fuente('src/presentation/services/cola-del-lote.ts')).toContain('p.cola.ocupada()')
  })
})
