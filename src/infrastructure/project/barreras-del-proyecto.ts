import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { barrerasRotas, type BarreraRota } from '@domain/project/barrera-rota'
import { hooksDeclarados } from '@domain/project/hook-del-proyecto'
import { interpreteExiste } from './interprete-existe'

/**
 * EL PRE-VUELO: antes de que el turno corra sobre un proyecto, comprobar que las
 * barreras que ese proyecto declara pueden arrancar.
 *
 * Solo `PreToolUse`, y es la linea correcta: es el unico evento que puede DECIR
 * QUE NO —devuelve `{"decision":"block"}` y la herramienta no se ejecuta—. Un
 * `PostToolUse` roto pierde un aviso; un `PreToolUse` roto deja pasar la escritura
 * que venia a impedir. Lo que este arco protege es lo irreversible.
 *
 * SOLO LEE. No ejecuta el hook, no lo repara y no toca el proyecto: FORTRESS
 * audita, y arreglarle el settings a un cliente sin pedirselo seria editar codigo
 * ajeno por iniciativa propia.
 */
export function barrerasDelProyecto(projectPath: string): readonly BarreraRota[] {
  const settings = leerSettingsDelProyecto(projectPath)

  // SIN `if (settings === null)`: lo tuve puesto y al romperlo no cayo nadie,
  // porque `hooksDeclarados` ya devuelve lista vacia ante null, basura o un
  // `hooks` que no es objeto. Repetir aqui la garantia que el dominio ya da es
  // la pared pintada: no defiende nada y hace creer que defiende algo.
  return barrerasRotas(hooksDeclarados(settings, 'PreToolUse'), (b) => interpreteExiste(b))
}

/**
 * El `.claude/settings.json` del proyecto, o null. Molde de `readProjectMcpServers`,
 * que ya lee el `.mcp.json` de al lado por el mismo motivo: la configuracion del
 * proyecto es un dato del proyecto y se lee de donde el operador la dejo.
 *
 * Traga su error y devuelve null, que `hooksDeclarados` lee como «ningun hook».
 * No haber podido MIRAR no es estar roto: afirmar «esta roto» porque el fichero
 * no se dejo leer seria inventar un hallazgo, y encima uno que en autonomo
 * bloquearia el lote. El fail-closed cuelga de una barrera ENCONTRADA, nunca de
 * la duda.
 *
 * Exportado porque el bloque de barreras del prompt (ADR-104) lee el MISMO
 * fichero: dos lectores serian dos verdades.
 */
export function leerSettingsDelProyecto(projectPath: string): unknown {
  try {
    return JSON.parse(readFileSync(join(projectPath, '.claude', 'settings.json'), 'utf8'))
  } catch {
    return null
  }
}
