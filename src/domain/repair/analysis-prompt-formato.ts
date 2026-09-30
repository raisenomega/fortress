import { FORMA_DE_NOTA, NOTAS_COMO_CLAVE } from '../system/peticion-de-notas'

/**
 * El contrato de formato, DICHO AL MODELO y no solo sabido por el codigo.
 *
 * La regla del objeto unico vivia solo en un comentario, y el prompt hacia lo
 * contrario de lo que ese comentario pedia: anunciaba "notes" en un parrafo
 * aparte, con un array suelto por ejemplo. El analista lo leyo como una seccion
 * independiente —lectura razonable— y respondio en dos bloques; el parser barre
 * del primer { al ultimo }, se trago los dos, y un analisis correcto se perdio
 * por la forma.
 *
 * Por eso cada restriccion viene con su POR QUE: una regla con motivo se respeta
 * mejor que una arbitraria, y aqui los motivos caben en una linea.
 *
 * Vive aparte del prompt porque son dos cosas distintas —que se pide y como se
 * responde— y juntas ya no cabian en un archivo.
 *
 * La peticion de notas es la COMPARTIDA. Este prompt tenia su copia y pedia el
 * `area` en TEXTO LIBRE —«zona»—: era el unico de los cinco que no podia
 * clasificar, y sus notas acabaron en cinco filas de `otro` con 196 de 320
 * avistamientos del backlog (medido en la base viva).
 */
export const FORMATO = [
  '',
  'FORMATO — responde con UN UNICO objeto JSON y NADA mas: ni un segundo bloque,',
  'ni texto fuera del objeto. Tu respuesta se lee barriendo del primer { al ultimo },',
  'asi que cualquier otro JSON en el mensaje se mezcla con este y se pierde el',
  'analisis entero.',
  '',
  'Claves: "status" ("REAL" u "OBSOLETO"), y "whatToChange", "where", "patternToCopy",',
  '"doNotTouch", "risk" en prosa inerte en espanol.',
  '',
  'El ancla `fichero:linea` dice donde se DETECTO el defecto, no donde va el',
  'arreglo. "where" es tu juicio y puede apuntar a otro sitio: un defecto que es',
  'una AUSENCIA no esta en ninguna linea concreta, y las reglas de capas del',
  'proyecto pueden prohibir arreglarlo justo donde se vio. Di en "where" los',
  'ficheros que de verdad hay que tocar, aunque no sea el del ancla, y explica en',
  '"whatToChange" por que ahi.',
  '',
  '"arreglo" (OBLIGATORIA con status REAL): {"file":"ruta relativa al repo","line":numero o null},',
  'el fichero donde VA el cambio principal; si es el del ancla, repite el ancla. FORTRESS',
  'contrasta ese fichero con la correa ANTES de generar y, si no cabe, no gasta: lo dice.',
  '',
  '"mismoDefectoQue" (opcional): los ids entre corchetes de los hermanos de tu MISMA SEDE',
  'que sean el MISMO defecto que este, no una sede parecida. Solo ids de esa lista:',
  'cualquier otro se ignora. FORTRESS los fundira y conservara el mas antiguo.',
  '',
  'Si el hallazgo empaqueta DOS defectos con arreglos en sitios distintos, dilo en',
  '"whatToChange" y trata el del ancla: partirlo es del escaner, no tuyo.',
  '',
  'Si el status es "OBSOLETO", la clave "evidencia" es OBLIGATORIA: es lo UNICO que',
  'cierra un hallazgo. Lleva {"marcador","forma"} y opcionalmente "commit". El',
  '"marcador" es una cadena LITERAL que FORTRESS buscara por su cuenta en el fichero',
  'del hallazgo; "forma" dice que espera encontrar: "ausente" si el marcador es la',
  'huella del defecto y ya no esta, "presente" si es el control que lo tapa y ahora',
  'si esta. Elige el marcador que se romperia si el defecto volviera, no el mas comodo:',
  'un marcador trivial no prueba nada aunque cuadre.',
  '',
  'El "commit" NO decide, solo acompana: una cita puede ser cierta y no probar nada',
  '—el commit que cerro un hallazgo de CSP anadio un comentario y dejo el agujero en',
  'su sitio—. Si la evidencia no cuadra contra el fichero, el hallazgo NO se cierra:',
  'queda mitigado esperando a un humano. Argumentar que tocarlo es arriesgado NO es',
  'evidencia de que el defecto no este; si el defecto sigue, el status es "REAL".',
  '{"status":"OBSOLETO","evidencia":{"marcador":"execFile(","forma":"ausente"},...}',
  '',
  NOTAS_COMO_CLAVE,
  '',
  // El objeto ENTERO es la leccion de ESTE prompt: el analista leyo «notes» como
  // seccion propia, respondio en dos bloques y el barrido se trago los dos. El
  // texto compartido dice la regla; esta linea la ENSENA.
  '{"status":"REAL","whatToChange":"...","where":"...","arreglo":{"file":"...","line":12},',
  ` "patternToCopy":"...","doNotTouch":"...","risk":"...","notes":[${FORMA_DE_NOTA}]}`
]
