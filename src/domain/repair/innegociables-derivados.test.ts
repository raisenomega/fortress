import { describe, expect, it } from 'vitest'
import { cubierto, fuente, todos } from './innegociables-fixture'

/**
 * La lista innegociable se ha quedado corta CUATRO veces, y siempre igual: una
 * defensa se muda a un fichero nuevo y la lista, que sigue al fichero, se queda
 * mirando donde ya no esta. `buildEnv` salio de `claude-cli`; `sanearParaPrompt`
 * de `knownFindings`; el turno del arbol de `apply-auto-merge`.
 *
 * Esto no deriva la lista entera —el criterio es un juicio y no un patron—, pero
 * si la CLASE que se ha escapado siempre: quien construye un entorno, quien
 * sanea texto ajeno y quien toma un turno. Un fichero nuevo que exporte una de
 * esas y no entre en la lista falla aqui, sin que nadie se acuerde de mirar.
 */
const CONTROLES =
  /export (?:async )?function (build\w*Env|gitEnv\w*|redactSecrets|sanear\w+|guard\w+|conCarril\w+|capacidadesDe|bloqueDeCapacidades|cabeceraSinPropia|leerZombis|leerArreglo|arregloFueraDeCorrea|huellaDelMotivo|guardDelArreglo|hasBlockingRejection|isRetryable|zombisSinGemela|reclasificar|veredictosDelLote|redDeLaFusion|planDeFusion|fusionesDelPasoB|fundirEnCaliente|leerOtros|retipar|fusionesDelRetipado|fusionPorJuicio|idsAdmitidos|createAliasWrites|createFusionPorJuicio|fundirPorJuicio|leerMismoDefecto|paresCandidatos|veredictosDePares|fusionesDelLote)\b|export const (HERRAMIENTAS_DEL_SERVIDOR|GRAPH_READ_TOOLS|RECLASIFICAR_FINDING|MARCAR_FUSIONADA)\b/

/**
 * La otra clase que se escapo, y por la misma razon: `main-window` decidia el
 * aislamiento del renderer y la lista lo cubria con `electron/**`, un patron que
 * no encajaba con su ruta real. Quien DECIDE si el renderer esta aislado —donde
 * quiera que viva— tiene que estar cubierto.
 */
const AISLAMIENTO = /\b(nodeIntegration|contextIsolation|exposeInMainWorld)\b/

/** Y la tercera: quien decide que clave de configuracion es publica, o toca la
 *  key cifrada. `safeStorage.` con punto —la palabra suelta sale en un
 *  comentario de `context`, y marcarlo seria pedir proteger el mapa de puertos. */
const SECRETOS = /\bencryptedApiKey\b|\bisPublicSettingKey\b|\bsafeStorage\.|\bPUBLIC_KEYS\b/

const defensas = todos.filter((f) => CONTROLES.test(fuente(f)))
const ventanas = todos.filter((f) => AISLAMIENTO.test(fuente(f)))
const secretos = todos.filter((f) => SECRETOS.test(fuente(f)))

describe('toda defensa esta en la lista que el auto-merge no puede tocar', () => {
  it('el barrido encuentra defensas: si no, la regex dejo de valer', () => {
    expect(defensas.length).toBeGreaterThan(3)
  })

  it.each(defensas)('%s es innegociable', (fichero) => {
    // Si esto falla al mover una guarda, la respuesta NO es aflojar la regex:
    // es anadir el fichero. La defensa se mudo; la proteccion tiene que seguirla.
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it.each(ventanas)('%s decide el aislamiento del renderer: innegociable', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it.each(secretos)('%s guarda la key cifrada: innegociable', (fichero) => {
    expect({ fichero, protegido: cubierto(fichero) }).toEqual({ fichero, protegido: true })
  })

  it('la lista se cubre a si misma, y tambien el modulo que la parte', () => {
    // Sin esto, una propuesta podria integrar sola el borrado de la proteccion.
    expect(cubierto('src/domain/repair/auto-merge-blacklist.ts')).toBe(true)
    expect(cubierto('src/domain/repair/innegociables-defensa.ts')).toBe(true)
    expect(cubierto('src/domain/repair/innegociables-prompt.ts')).toBe(true)
    expect(cubierto('src/domain/repair/innegociables-fusion.ts')).toBe(true)
  })
})
