import { controlesEnHeadGit } from '../git/controles-en-head'
import { alcanza, olvidarImports } from './grafo-de-imports'
import type { RutaDelControl } from '@domain/project/ruta-del-control'

/**
 * Adaptador de `RutaDelControl`: presencia + atribucion por git (pickaxe sobre el
 * marcador) y ruta por conectividad de imports (BFS sobre el disco).
 *
 * `enRuta` prueba las DOS direcciones porque las cadenas reales van en ambos
 * sentidos: el control IMPORTA al ancla (cobaya 1: `account-handlers` envuelve
 * `startLogin`) o el ancla importa al control (cobaya 2: `repair-gate-handler` →
 * `run-gate` → `gate-guards`). El grafo cachea por corrida (`olvidarImports`).
 */
export function createRutaDelControl(): RutaDelControl {
  return {
    controlesEnHead: (projectPath, marcador) => controlesEnHeadGit(projectPath, marcador),
    enRuta: (projectPath, ancla, file) =>
      alcanza(projectPath, ancla, file) || alcanza(projectPath, file, ancla),
    olvidar: olvidarImports
  }
}
