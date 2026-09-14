import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * El barrido toma el carril UNA vez para TODO el recorrido, como el escaneo lo
 * toma una vez para sus XX paradas: «las XX paradas son un solo trabajo, y
 * trocearlo dejaria colar otro escaneo entre dos de ellas».
 *
 * Verificar de una en una toma y suelta el carril por hallazgo, que es correcto
 * para un gesto suelto y seria un agujero aqui: con veintiseis mitigados serian
 * veintiseis huecos por los que colar otra corrida a mitad.
 *
 * Y ahora son DOS puertas —todos los mitigados, o los que el operador marco— con
 * un solo turno detras, tomado una vez por barrido y no por puerta ni por fila.
 *
 * El turno vive en el MISMO fichero que registra los canales, y esa cercania no
 * es cosmetica: `guards-del-codigo` solo sigue ayudantes del fichero que lee, asi
 * que un turno mudado a otro modulo se vuelve invisible y la columna «Guards» de
 * docs/IPC.md ya no se puede comprobar contra nada.
 *
 * Se lee el FUENTE, como `quien-tiene-techo`: tomar el carril una vez o tomarlo
 * N no deja rastro en ningun tipo. Los dos caminos compilan igual.
 */
const fuente = (ruta: string): string => readFileSync(join(process.cwd(), ruta), 'utf8')

const HANDLER = 'src/infrastructure/ipc/finding-verify-all-handler.ts'
const CARRIL = HANDLER
const BUCLE = 'src/application/repair/recorrer-verificaciones.ts'

describe('el barrido de mitigados toma el carril una sola vez', () => {
  it('el carril se pide UNA vez y se suelta UNA vez, pase lo que pase', () => {
    const texto = fuente(CARRIL)

    expect([...texto.matchAll(/\bguardRun\(/g)]).toHaveLength(1)
    expect([...texto.matchAll(/\bendRun\(/g)]).toHaveLength(1)
    expect(texto).toMatch(/finally\s*\{\s*endRun\(id\)/)
  })

  it('LAS DOS PUERTAS pasan por el mismo carril: ninguna se lo monta aparte', () => {
    const texto = fuente(HANDLER)
    const puertas = [...texto.matchAll(/IPC\.findingVerify(All|Selected)\b/g)]

    expect(puertas).toHaveLength(2)
    // Las dos entran por el mismo sitio: dos LLAMADAS (la definicion no cuenta)
    // y un solo `guardRun`, que es el de dentro.
    expect([...texto.matchAll(/barrerConTurno\(String\(/g)]).toHaveLength(2)
  })

  it('el bucle NO toca el carril: quien lo toma es la puerta, no cada vuelta', () => {
    expect(fuente(BUCLE)).not.toMatch(/\b(guardRun|endRun|tryBeginRun)\b/)
  })

  it('el tope diario se cobra en la puerta, y por eso no esta dentro', () => {
    // `guardRun` comprueba contaminacion -> tope del dia -> carril. Es el unico
    // freno de dinero del gesto: dentro del bucle no hay ninguno, a proposito.
    expect(fuente(CARRIL)).toContain('guardRun')
    expect(fuente(BUCLE)).not.toMatch(/\btopeDiario\b/)
  })

  it('Detener es UNO para las dos puertas: detras hay un unico carril', () => {
    expect(fuente(HANDLER)).toMatch(/IPC\.findingVerifyAllStop[\s\S]{0,120}cancelRun\(/)
    expect([...fuente(HANDLER).matchAll(/cancelRun\(/g)]).toHaveLength(1)
  })
})
