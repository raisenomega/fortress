const NOTA = '{"kind":"limitacion|bug|gap|falta|oportunidad","area":"zona","note":"que paso"}'

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
  'Clave OPCIONAL "notes": si FORTRESS (la herramienta que te ejecuta, NO el proyecto',
  'que analizas) te limito o te falto algo —un bug, un gap, una restriccion de entorno,',
  'permisos o plan-mode que te impidio trabajar, o la OPORTUNIDAD de una capacidad que',
  'te habria ayudado—, anotalo ahi. No es un hallazgo del proyecto; es para que FORTRESS',
  'madure. Si no hubo nada, omite la clave.',
  '',
  '"notes" va DENTRO del objeto, como una clave mas. NUNCA en un bloque aparte:',
  '{"status":"REAL","whatToChange":"...","where":"...","patternToCopy":"...",',
  ` "doNotTouch":"...","risk":"...","notes":[${NOTA}]}`
]
