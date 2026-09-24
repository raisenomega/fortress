import { barrerasDeclaradas, type BarrerasDeclaradas } from '@domain/project/barreras-declaradas'
import { hooksDeclarados } from '@domain/project/hook-del-proyecto'
import { leerSettingsDelProyecto } from './barreras-del-proyecto'
import { readFortressConfig } from './fortress-config'
import { interpreteExiste } from './interprete-existe'

/**
 * Lo que el proyecto declara, leido de donde el pre-vuelo ya lo lee: el mismo
 * `.claude/settings.json`, el mismo `interpreteExiste`, el mismo
 * `.fortress/config`. Dos lectores del mismo fichero serian dos verdades
 * (ADR-059): por eso comparte `leerSettingsDelProyecto` en vez de copiarlo.
 *
 * SOLO LEE, como el pre-vuelo. El cerco cuenta como presente aunque sea
 * ilegible: el agente debe saber que hay un fichero ahi, y juzgar si esta bien
 * escrito es trabajo del pre-vuelo, no del prompt.
 */
export function barrerasDeclaradasDelProyecto(projectPath: string): BarrerasDeclaradas {
  const hooks = hooksDeclarados(leerSettingsDelProyecto(projectPath), 'PreToolUse')
  const config = readFortressConfig(projectPath).kind === 'not-present' ? 'ausente' : 'presente'
  return barrerasDeclaradas(hooks, (b) => interpreteExiste(b), config)
}
