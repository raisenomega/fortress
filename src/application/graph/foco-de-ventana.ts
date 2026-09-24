export interface FocoDeVentana {
  /** El renderer enfoco un proyecto: se reconcilia y se recuerda. */
  enfocar(projectId: string): void
  /** La ventana volvio a tener el foco: se reconcilia el ultimo enfocado, si lo hay. */
  ventanaActiva(): void
}

/**
 * El disparador determinista del reindex tras un cambio hecho FUERA (un pull,
 * un merge en la terminal): FORTRESS no vigila el disco ni tiene daemon, pero
 * si sabe cuando el operador vuelve a su ventana, y ese es el momento en que
 * el grafo viejo empieza a importar. Reconciliar es barato: `git rev-parse` y
 * comparar; si HEAD no se movio, la decision del dominio dice SKIP.
 */
export function crearFocoDeVentana(reconciliar: (projectId: string) => void): FocoDeVentana {
  let ultimo: string | null = null
  return {
    enfocar: (projectId) => {
      ultimo = projectId
      reconciliar(projectId)
    },
    ventanaActiva: () => {
      if (ultimo !== null) reconciliar(ultimo)
    }
  }
}
