import type { FileHistory } from '@domain/project/file-history'
import type { FindingMemory } from '@domain/project/finding-memory'

/**
 * Cuales de los hallazgos que este escaneo VUELVE A VER conservan su marca de
 * mitigado en vez de volver a ACTIVE.
 *
 * Que el escaner lo siga viendo no es novedad: es justo lo que la marca ya
 * reconoce. El operador dijo "esto ya esta arreglado" sabiendo que el arreglo
 * vive en OTRO archivo —una guarda que se movio a su propio modulo, por
 * ejemplo— y que el escaner seguira leyendo el archivo del hallazgo y seguira
 * encontrandolo ahi. Si cada escaneo borrase la marca, marcarla no serviria de
 * nada.
 *
 * Lo que SI es novedad es que el archivo del hallazgo cambie despues de la
 * marca: alguien volvio a tocar ese sitio y el problema sigue reportandose, asi
 * que la declaracion del operador ya no cubre lo que hay ahora. Ahi vuelve a
 * ACTIVE.
 *
 * ATENCION AL `false` DE `changedSince`, QUE AQUI SIGNIFICA LO CONTRARIO QUE EN
 * LA EXTINCION. Alla un `false` —no hay git, git fallo, la fecha no se pudo
 * leer— impide extinguir: sin evidencia no se cierra nada. Aqui un `false`
 * CONSERVA la marca: sin evidencia no se deshace una decision humana explicita.
 * Los dos son el lado conservador de su sitio, y son opuestos. No "alinear" uno
 * con el otro.
 */
export async function decideConservados(
  history: FileHistory,
  projectPath: string,
  memory: readonly FindingMemory[],
  reportedIdentities: ReadonlySet<string>
): Promise<ReadonlySet<string>> {
  const marcados = memory.filter(
    (f) => f.lifecycle === 'MITIGATED' && f.mitigatedAt !== null && reportedIdentities.has(f.identity) // prettier-ignore
  )

  const decididos = await Promise.all(
    marcados.map(async (f) => ({
      id: f.id,
      // Sin fecha no se puede comprobar nada; el filtro de arriba ya la exige.
      volvio: await history.changedSince(projectPath, f.file, f.mitigatedAt ?? '')
    }))
  )

  return new Set(decididos.filter((d) => !d.volvio).map((d) => d.id))
}
