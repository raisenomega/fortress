/**
 * Lo UNICO que corta el recorrido: el operador. Sin tope de gasto ni de tiempo:
 * el compromiso es con las XX paradas del manifiesto y se completan todas
 * (ADR-082, Enmienda 2).
 */
export interface RecorridoDeps {
  readonly cancelado: () => boolean
}
