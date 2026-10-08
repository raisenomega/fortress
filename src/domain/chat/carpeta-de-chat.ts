/**
 * Una CARPETA del organizador de Chat libre (PASO 114): pura organizacion de
 * conversaciones, estilo claude.ai. SIN repo por diseno — la regla de hierro
 * (web nunca toca repo) vive en el esquema: no hay donde atarlo. Las
 * `instrucciones` son la personalizacion por carpeta; se inyectan en el
 * prompt de libre DESPUES de la consigna, nunca dan poderes.
 */
export interface Carpeta {
  readonly id: string
  readonly nombre: string
  readonly instrucciones: string
  readonly createdAt: string
  readonly updatedAt: string
}
