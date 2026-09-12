/**
 * Las CUATRO formas en que una ruta se cuela en una observacion, cada una con su
 * patron. Viven aparte del cerco porque son la parte que CRECE —la cuarta se
 * anadio tras medir que cuarenta rutas absolutas sobrevivieron al barrido— y el
 * cerco es la doctrina, que no cambia.
 *
 * El ORDEN de aplicacion importa y esta en `redactarObservacion`: la absoluta
 * primero para que se lleve la ruta entera, y la cita antes que la ruta para
 * que no le arranquen el `:linea` y lo dejen suelto.
 */

/** Una cita `fichero:linea`, con o sin carpetas delante. Va PRIMERA: si fuera
 *  despues, el patron de ruta se llevaria el fichero y dejaria el `:40` suelto. */
export const CITA = /(?:[\w.@~-]+\/)*[\w.@-]+\.\w{1,10}:\d+/g

/** Una ruta con carpeta y extension. Exige la BARRA a proposito: `README.md` o
 *  `package.json` a secas no identifican a nadie —los tiene todo proyecto— y
 *  tacharlos solo destroza la nota. */
export const RUTA = /(?:[\w.@~-]+\/)+[\w.@-]+\.\w{1,10}/g

/** Una carpeta de codigo sin fichero: `supabase/functions`, `apps/api/src`. Sin
 *  extension no la cazan las otras dos, y `supabase/functions/...` fue una de
 *  las ocho fugas reales. Anclada a prefijos conocidos para no tachar cualquier
 *  cosa con una barra dentro. */
export const CARPETA = /(?<!\/(?:usr|etc|bin|sbin|var|tmp|proc|sys)\/)\b(?:src|apps|packages|services|supabase|lib|test|tests|docs|scripts|prisma|migrations)(?:\/[\w.@-]+)+/g // prettier-ignore

/**
 * Una ruta ABSOLUTA bajo una raiz donde viven proyectos de personas. Va PRIMERA
 * de las cuatro: se lleva la ruta entera, con su `:linea` si la trae, en vez de
 * dejar que `CITA` le arranque el final y sobreviva el principio.
 *
 * Anclada a `/home`, `/media`, `/mnt`, `/opt` y `/Users`, y NO a `/usr`, `/etc`,
 * `/tmp` ni `/bin`: las primeras llevan dentro el nombre de una persona o de un
 * cliente —`/media/disco/Cliente ACME` ya dice de quien es el codigo— y las
 * segundas son del sistema y no identifican a nadie. Tachar `/usr/lib` solo
 * destrozaria una nota que habla de una libreria.
 *
 * Los ESPACIOS son el caso dificil y no es hipotetico: el proyecto real
 * `/media/jojo/Jorge_Ibrain/Health Flow V1_FINAL` los lleva. Un patron que no
 * los admita taja hasta `Health` y deja «Flow V1_FINAL» suelto, que es el
 * nombre del cliente sobreviviendo al cerco.
 *
 * Se admiten con UNA condicion: que el ultimo segmento de la ruta empiece en
 * MAYUSCULA. Un nombre propio continua en mayusculas —`Cliente ACME`, `Health
 * Flow V1_FINAL`— y un slug en minuscula no. Sin esa condicion, la nota real
 * «...fortress-command-center NO esta indexado» perdia el `NO` y quedaba
 * diciendo lo contrario de lo que decia: este codigo escribe en mayusculas para
 * enfatizar, asi que absorber cualquier palabra en caps se come la prosa.
 */
export const RUTA_ABSOLUTA =
  /(?:\/(?:home|media|mnt|opt|Users))(?:(?:\/[\w.@~-]+)*\/[A-Z][\w.@~-]*(?:[ \t]+[A-Z0-9][\w.@~-]*)+|(?:\/[\w.@~-]+)+)(?::\d+)?/g
