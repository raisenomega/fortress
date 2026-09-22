/**
 * La CUARTA familia del criterio innegociable: la contencion de rutas en el
 * disco del repositorio AUDITADO. Ver `criterio-innegociable.ts`.
 *
 * Sale a su propio modulo por lo mismo que salio la tercera: la lista llego a su
 * techo de lineas y el corte se hace por familia, no por tamano.
 *
 * Lo que estas dos defienden es que componer una ruta con `join` es un filtro
 * LEXICO y un enlace simbolico no lo es. `docs-reader` ya lo tenia resuelto y
 * escrito —"un POLICY.md de la raiz puede ser un enlace a un fichero de
 * credenciales del operador"— y era el unico sitio que lo aplicaba; los otros
 * siete escribian y leian a pelo. Ahora el control es uno y compartido, y por
 * eso mismo un fix que lo debilite no puede entrar sin firma.
 */
export const DEFENSAS_DEL_DISCO: readonly string[] = [
  'src/infrastructure/fs/ruta-contenida.ts',
  'src/infrastructure/newproject/docs-reader.ts',
  // La CAJA (ADR-092): la contencion de lo que CORRE —bwrap, la config del CLI,
  // la tabla de registros, el proxy y la sonda—. Entera, como `posture/**`:
  // un host mas en la tabla es una linea, y la deriva `innegociables-caja.test`.
  'src/domain/sandbox/**',
  'src/infrastructure/sandbox/**',
  'src/domain/repair/innegociables-disco.ts'
]
