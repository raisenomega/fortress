import { redactSecrets } from '../chat/tool-detail'

/** Lo que queda donde estaba la cita. Entre comillas angulares porque no es
 *  texto del agente: es una marca de que AQUI habia algo y se retiro. */
export const RUTA_REDACTADA = '‹ruta del proyecto›'

/** Una cita `fichero:linea`, con o sin carpetas delante. Va PRIMERA: si fuera
 *  despues, el patron de ruta se llevaria el fichero y dejaria el `:40` suelto. */
const CITA = /(?:[\w.@~-]+\/)*[\w.@-]+\.\w{1,10}:\d+/g

/** Una ruta con carpeta y extension. Exige la BARRA a proposito: `README.md` o
 *  `package.json` a secas no identifican a nadie —los tiene todo proyecto— y
 *  tacharlos solo destroza la nota. */
const RUTA = /(?:[\w.@~-]+\/)+[\w.@-]+\.\w{1,10}/g

/** Una carpeta de codigo sin fichero: `supabase/functions`, `apps/api/src`. Sin
 *  extension no la cazan las otras dos, y `supabase/functions/...` fue una de
 *  las ocho fugas reales. Anclada a prefijos conocidos para no tachar cualquier
 *  cosa con una barra dentro. */
const CARPETA = /\b(?:src|apps|packages|services|supabase|lib|test|tests|docs|scripts|prisma|migrations)(?:\/[\w.@-]+)+/g // prettier-ignore

/**
 * El cerco de ADR-085: ninguna observacion de auto-mejora puede llevarse codigo
 * del cliente.
 *
 * REDACTA, nunca rechaza. Las ocho fugas que el inventario del 2026-09-11
 * encontro en el backlog eran observaciones LEGITIMAS sobre FORTRESS —«el grafo
 * no modela politicas RLS», «trace_path resuelve mal simbolos duplicados»— que
 * citaron el codigo que tenian delante para explicarse. El valor esta en la
 * observacion, no en la cita: tirar la nota entera perderia el aprendizaje y
 * ganaria lo mismo que tachar la ruta. Ante la duda se conserva (ADR-065).
 *
 * Redacta SIEMPRE, sin mirar de que proyecto viene. Distinguir el repo propio
 * seria util —perdemos el localizador en nuestras propias notas— pero la
 * excepcion se decidiria por el NOMBRE del proyecto, que lo pone el operador y
 * puede ser cualquiera; una garantia con una puerta falsificable no es una
 * garantia. El mismo motivo por el que los innegociables pasaron a cubrirse por
 * carpeta entera en vez de enumerando.
 *
 * Y llama a `redactSecrets`: una cita puede traer pegado un token. Vive en
 * `tool-detail`, que es INNEGOCIABLE — se llama, no se toca.
 *
 * LIMITE HONESTO, dicho aqui y en el ADR: esto no alcanza a la logica de negocio
 * descrita sin cita. «El precio se resuelve por coincidencia difusa del nombre
 * de producto» no lleva ni una ruta y sigue siendo del cliente. El cerco reduce
 * la fuga; no la elimina. Por eso la transmision automatica exige consentimiento.
 */
export function redactarObservacion(texto: string, projectPath?: string): string {
  const sinRutaAbsoluta = ocultarRaiz(texto, projectPath)
  const sinCitas = sinRutaAbsoluta
    .replace(CITA, RUTA_REDACTADA)
    .replace(RUTA, RUTA_REDACTADA)
    .replace(CARPETA, RUTA_REDACTADA)
  return redactSecrets(sinCitas)
}

/** La raiz del proyecto, si se sabe: una ruta absoluta delata al cliente incluso
 *  sin fichero detras —`/home/ana/clientes/acme` ya dice de quien es—. */
function ocultarRaiz(texto: string, projectPath?: string): string {
  if (projectPath === undefined || projectPath.trim().length === 0) return texto
  return texto.split(projectPath).join(RUTA_REDACTADA)
}
