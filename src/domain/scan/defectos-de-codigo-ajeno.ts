/**
 * Los tipos que faltaban para clasificar codigo que no es el nuestro (ADR-081).
 *
 * Derivados del corpus, no de OWASP: cada uno existe porque al menos un defecto
 * real de las 119 filas vivas de un e-commerce lo pedia, y el numero de filas
 * que lo pedian esta al lado. Es el metodo de ADR-067 con otro corpus.
 *
 * Sin ellos, los cinco puntos de la SECURITY_CHECKLIST tenian casa para uno
 * solo (inyeccion, y a medias), y un rate limit ausente hacia al escaner probar
 * cuatro tipos por turnos — que es como el mismo defecto acabo con diez filas.
 *
 * `deserializacion-insegura` NO esta: la checklist la pide, pero ninguna fila
 * del corpus la pidio, y anadir un tipo que ningun defecto reclamo es volver a
 * la lista generica que ADR-067 rechazo. Es la primera candidata cuando aparezca.
 */
export const DEFECTOS_DE_CODIGO_AJENO = {
  /** 23 filas. */
  'rate-limit-ausente': 'un recurso se consume sin tope por quien llama: sin rate limiting o sin cuota.', // prettier-ignore
  /** 18 filas. */
  'fuga-de-informacion-en-error': 'la respuesta de error entrega detalle interno a quien no debe verlo.', // prettier-ignore
  /** 17 filas. */
  'relay-abierto': 'algo que envia o publica hacia fuera acepta destino o contenido de quien llama.', // prettier-ignore
  /** 12 filas. */
  'confianza-en-datos-del-cliente': 'un dato que decide dinero, estado o identidad se toma del cuerpo de la peticion.', // prettier-ignore
  /** 11 filas. */
  'secreto-versionado': 'un secreto esta en el repositorio: .env rastreado o credencial en el codigo.', // prettier-ignore
  /** 10 filas. */
  'autorizacion-ausente': 'quien no deberia alcanza el dato o la operacion: sin RLS, policy amplia, sin sesion.', // prettier-ignore
  /** 6 filas. */
  'control-evadible': 'el control existe pero se rodea: falla del lado de permitir, o su clave la dicta quien llama.', // prettier-ignore
  /** 5 filas. */
  'cabecera-de-seguridad-ausente': 'faltan las cabeceras de seguridad, o estan donde el despliegue real no las aplica.', // prettier-ignore
  /** 4 filas. */
  'salida-sin-escapar': 'dato no confiable interpolado en HTML, SQL, shell o correo sin escapar.', // prettier-ignore
  /** 4 filas. */
  'cors-permisivo': 'la politica CORS admite origenes que no deberia, incluido * o localhost en produccion.', // prettier-ignore
  /** 1 fila. Se conserva aunque aparezca una vez: ADR-067 ya decidio que las
   *  clases que pueden repetirse no se mandan a `otro`. */
  'identificador-predecible': 'un identificador que protege un recurso se puede adivinar o enumerar.' // prettier-ignore
} as const
