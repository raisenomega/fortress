/**
 * Lo que dice la barra sobre la seleccion. Dos numeros y no uno, porque la
 * seleccion PERSISTE al cambiar de chip: si eliges cinco CRITICAL y saltas a
 * MEDIUM, esos cinco siguen elegidos pero no estan delante.
 *
 * Sin el segundo numero, la barra diria «5 seleccionados» sobre una tabla donde
 * no se ve ninguno, y verificarlos seria dispararle a algo que no miras. Con el,
 * el operador sabe que su seleccion esta viva y en otro sitio.
 *
 * Vive aparte del componente para poder probarse, y el componente lo consume:
 * asi el texto que se prueba es el que se pinta, no una copia que se desincroniza.
 */
export function fraseDeSeleccion(seleccionados: number, visibles: number): string {
  const plural = seleccionados === 1 ? '' : 's'
  if (visibles === seleccionados) return `${seleccionados} seleccionado${plural}`
  return `${seleccionados} seleccionado${plural} (${visibles} visible${visibles === 1 ? '' : 's'})`
}
