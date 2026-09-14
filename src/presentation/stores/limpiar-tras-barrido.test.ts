import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { useTableroStore } from './tablero-store'

const store = (): ReturnType<typeof useTableroStore.getState> => useTableroStore.getState()
const del = (pid: string): ReadonlySet<string> => store().seleccion[pid] ?? new Set()

beforeEach(() => useTableroStore.setState({ severidad: {}, estado: {}, seleccion: {} }))

describe('la seleccion no sobrevive al barrido que la gasto', () => {
  it('el servicio limpia al terminar: era «lo que voy a hacer», no «lo que hice»', () => {
    // Los extinguidos se podan solos al salir de la tabla, pero un `sin_prueba`
    // sigue MITIGADO y seguiria marcado: la barra quedaria armada para regastar
    // sobre los mismos que acaban de contestar que no se pudo comprobar.
    const fuente = readFileSync(join(process.cwd(), 'src/presentation/services/verificacion-masiva-service.ts'), 'utf8') // prettier-ignore

    expect(fuente).toMatch(/useTableroStore\.getState\(\)\.limpiar\(projectId\)/)
    // En el `finally`, con el `terminar()`: si solo limpiara al acabar bien, un
    // Detener dejaria la seleccion viva sobre lo ya verificado.
    expect(fuente).toMatch(/terminar\(\)[\s\S]{0,400}limpiar\(projectId\)/)
  })

  it('y limpiar deja el conjunto vacio, no lo borra del mapa', () => {
    store().alternar('p1', 'a')

    store().limpiar('p1')

    expect(del('p1').size).toBe(0)
  })
})
