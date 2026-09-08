/**
 * Que hacer cuando dos tipos parecen encajar. Es la mitad que ADR-067 no dio:
 * cerro el vocabulario pero no la ELECCION, y sin desempate el mismo defecto
 * sale con un tipo distinto en cada corrida — `send-invoice:268` llego a tener
 * cuatro tipos y diez filas.
 *
 * Solo los pares que el corpus demostro confundibles. Una regla por par, en la
 * forma "sintoma -> tipo", que es como se elige rapido y sin releer la lista.
 */
export const DESEMPATES: readonly string[] = [
  'No hay tope -> rate-limit-ausente. Hay tope y no se consulta -> tope-no-consultado. Hay tope y se rodea o falla del lado de permitir -> control-evadible.', // prettier-ignore
  'El dato manda (precio, estado, identidad) -> confianza-en-datos-del-cliente. Se valida en un camino y no en el otro -> validacion-asimetrica. Se interpola en HTML, SQL, shell o correo -> salida-sin-escapar.', // prettier-ignore
  'Detalle interno (mensaje de error, identificador, traza) -> fuga-de-informacion-en-error. Un secreto de verdad -> secreto-sin-redactar. Un secreto en el repositorio -> secreto-versionado.', // prettier-ignore
  'Nadie comprueba quien llama -> autorizacion-ausente. No se exige project.trusted, que solo existe en FORTRESS -> missing-trust-check.', // prettier-ignore
  'IPv4 mapeada en IPv6 -> ssrf-ipv6-mapped. Decimal, hexadecimal u octal -> ssrf-ipv4-formatos.'
]
