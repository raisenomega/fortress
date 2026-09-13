import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El barrido toma el carril UNA vez para TODO el recorrido, como el escaneo lo
 * toma una vez para sus XX paradas: «las XX paradas son un solo trabajo, y
 * trocearlo dejaria colar otro escaneo entre dos de ellas».
 *
 * Verificar de una en una toma y suelta el carril por hallazgo, que es correcto
 * para un gesto suelto y seria un agujero aqui: con 26 mitigados serian 26
 * huecos por los que colar otra corrida —o un segundo barrido— a mitad.
 *
 * Se lee el FUENTE, como `quien-tiene-techo`: la diferencia entre tomar el
 * carril una vez y tomarlo N no deja rastro en ningun tipo. Los dos caminos
 * compilan igual, asi que el unico sitio donde se comprueba es donde se escribe.
 */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

const HANDLER = 'src/infrastructure/ipc/finding-verify-all-handler.ts'
const BUCLE = 'src/application/repair/verificar-todos.ts'

describe('el barrido de mitigados toma el carril una sola vez', () => {
  it('el handler pide el carril UNA vez y lo suelta UNA vez', () => {
    const texto = fuente(HANDLER)

    expect([...texto.matchAll(/\bguardRun\(/g)]).toHaveLength(1)
    expect([...texto.matchAll(/\bendRun\(/g)]).toHaveLength(1)
  })

  it('y lo suelta en un finally: un fallo no puede dejar el proyecto tomado', () => {
    expect(fuente(HANDLER)).toMatch(/finally\s*\{\s*endRun\(id\)/)
  })

  it('el bucle NO toca el carril: quien lo toma es la puerta, no cada vuelta', () => {
    // Si el carril bajara al bucle, volveriamos a tener un turno por hallazgo
    // sin que el handler cambiara una linea.
    expect(fuente(BUCLE)).not.toMatch(/\b(guardRun|endRun|tryBeginRun)\b/)
  })

  it('el tope diario se cobra en la puerta, y por eso no esta dentro', () => {
    // `guardRun` comprueba contaminacion -> tope del dia -> carril. Es el unico
    // freno de dinero del gesto: dentro del bucle no hay ninguno, a proposito.
    expect(fuente(HANDLER)).toContain('guardRun')
    expect(fuente(BUCLE)).not.toMatch(/\btopeDiario\b/)
  })

  it('Detener vive en su canal propio y llama a cancelRun, como el del escaneo', () => {
    expect(fuente(HANDLER)).toMatch(/IPC\.findingVerifyAllStop[\s\S]{0,120}cancelRun\(/)
  })
})
