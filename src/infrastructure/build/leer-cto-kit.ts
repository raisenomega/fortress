import { app } from 'electron'
import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import type { MarcoDelKit } from '@domain/build/bloque-cto-kit'

/** En `userData`, hermana del `audit-kit` (ADR-083 cerebro/ejecutor): la
 *  doctrina es del operador y viaja con el; el binario no la lleva dentro.
 *  La carpeta NO nace por codigo — la siembra el operador, como su hermana. */
const CARPETA = 'cto-kit'

/**
 * Los marcos sembrados en una carpeta, en orden de nombre. SIN prefijo, a
 * diferencia del audit-kit: alli la clave elegia el modulo del manifiesto;
 * el CTO global (Corte A) los ve todos (A1, decidido en el 128). La ilegible
 * cae UNA A UNA —un fichero roto no tumba el kit— y la carpeta ausente
 * devuelve [], que no es una averia: es un kit sin sembrar.
 */
export function leerKitDe(carpeta: string): readonly MarcoDelKit[] {
  try {
    return readdirSync(carpeta)
      .filter((n) => n.endsWith('.md'))
      .sort()
      .flatMap((n) => {
        try {
          return [{ nombre: n.replace(/\.md$/, ''), texto: readFileSync(join(carpeta, n), 'utf8') }] // prettier-ignore
        } catch {
          return [] // la ilegible cae sola; las demas entran igual
        }
      })
  } catch {
    return [] // sin carpeta sembrada no hay nada que leer, y no es una averia
  }
}

/** El kit del CTO. `app.getPath` DENTRO del try (la leccion de leer-plantilla):
 *  sin un Electron vivo, el kit simplemente no esta. */
export function leerCtoKit(): readonly MarcoDelKit[] {
  try {
    return leerKitDe(join(app.getPath('userData'), CARPETA))
  } catch {
    return []
  }
}
