import { firstMatch } from '../shared/path-glob'
import { AUTONOMY_RULES_FILES } from './auto-merge-blacklist'

/**
 * Lo unico que la firma humana NO puede integrar, y por que existe la excepcion.
 *
 * El cerco de auto-merge —severidad, tamano, numero de archivos, la lista del
 * proyecto— acota la integracion AUTOMATICA: su propia doctrina dice que decide
 * "si una propuesta puede integrarse sin firma humana". Cuando hay firma, la
 * premisa de esas cuatro condiciones desaparece y el humano dispone.
 *
 * La lista de archivos que gobiernan la autonomia es otra cosa. Se aplica como
 * RESTA FINAL justamente para que ninguna declaracion la alcance, y una firma
 * que la alcanzara la convertiria en lo que se decidio que no fuera: una regla
 * cuya fuerza depende de que nadie diga lo contrario.
 *
 * El riesgo no es un operador malicioso; es firmar quince propuestas seguidas y
 * que una debilite una defensa sin que nadie la lea. Un limite que no depende de
 * la atencion es el unico que sobrevive a un lote.
 *
 * No quita poder: esos merges siguen siendo del operador con git en la mano. Lo
 * que se cierra es la via silenciosa, no la via.
 */
export function defensasQueToca(files: readonly string[]): readonly string[] {
  return files.filter((file) => firstMatch(file, AUTONOMY_RULES_FILES) !== null)
}
