/**
 * La cara del LAZO autonomo en el puente `repair` (ATERRIZAJE-1 y -4): la cola y
 * el ATERRIZAJE (commit durable + stash del WIP). Separada de `RepairApi` por el
 * techo de 75 lineas; `RepairApi extends RepairLazoApi`. Va por `repair` —y no un
 * namespace nuevo— para no tocar `preload/index.ts`, que es firmado.
 */
export interface RepairLazoApi {
  /** La cola del LAZO: ids elegibles en orden severidad-primero (ATERRIZAJE-1). */
  cola(projectId: string): Promise<readonly string[]>
  /** ATERRIZAJE-4: commit durable del trabajo del agente (LOCAL, nunca FORTRESS). */
  lazoCommit(
    projectId: string,
    findingId: string
  ): Promise<'commiteado' | 'sin-cambios' | 'fortress' | 'error'>
  /** Stash del WIP al arrancar el lazo (arbol limpio); devuelve si guardo algo. */
  lazoStash(projectId: string): Promise<boolean>
  /** Restaura el WIP al parar; 'conflicto' = no se forzo, el stash queda. */
  lazoPop(projectId: string): Promise<'restaurado' | 'vacio' | 'conflicto'>
}
