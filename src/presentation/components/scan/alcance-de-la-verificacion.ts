/**
 * De donde vino la peticion de verificar. Cambia QUE se va a comprobar, no como:
 * las dos puertas gastan lo mismo por hallazgo y las dos tienen que preguntar.
 */
export type AlcanceDeLaVerificacion = 'todos' | 'seleccionados'

export const QUE: Record<AlcanceDeLaVerificacion, (n: number, plural: string) => string> = {
  todos: (n, plural) => `los ${n} mitigado${plural}`,
  seleccionados: (n) => `${n === 1 ? 'la' : 'las'} ${n} que seleccionaste`
}

export const TITULO: Record<AlcanceDeLaVerificacion, string> = {
  todos: 'Verificar todos los mitigados',
  seleccionados: 'Verificar las seleccionadas'
}
