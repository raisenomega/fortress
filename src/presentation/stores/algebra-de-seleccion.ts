/**
 * Las operaciones sobre el conjunto de elegidos, puras y fuera del store: asi se
 * prueban sin montar zustand, y el store se queda en el cableado.
 *
 * Todas devuelven EL MISMO conjunto cuando no cambia nada. No es un ahorro de
 * memoria: es lo que evita que una recarga que no toco la seleccion dispare un
 * repintado de la tabla entera — con quinientas filas eso se nota.
 */
export function alternarUno(previo: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const siguiente = new Set(previo)
  if (!siguiente.delete(id)) siguiente.add(id)
  return siguiente
}

/**
 * El atajo de la cabecera: marca TODOS los de la vista, o los desmarca si ya
 * estaban todos.
 *
 * Es una union o una diferencia, NUNCA un reemplazo. La seleccion persiste al
 * cambiar de chip, asi que reemplazar el conjunto borraria en silencio lo que el
 * operador eligio en otra vista — justo lo que la barra promete que no pasa.
 */
export function alternarTodos(
  previo: ReadonlySet<string>,
  visibles: readonly string[]
): ReadonlySet<string> {
  if (visibles.length === 0) return previo

  const siguiente = new Set(previo)
  const todosPuestos = visibles.every((id) => previo.has(id))
  for (const id of visibles) {
    if (todosPuestos) siguiente.delete(id)
    else siguiente.add(id)
  }
  return siguiente
}

/** Quita los que ya no estan en la tabla. Devuelve el mismo si no sobra ninguno. */
export function podarSet(
  previo: ReadonlySet<string>,
  presentes: readonly string[]
): ReadonlySet<string> {
  const vivos = new Set([...previo].filter((id) => presentes.includes(id)))
  return vivos.size === previo.size ? previo : vivos
}
