import { useFranjaFija } from '../../hooks/useFranjaFija'
import { useActiveProject } from '../../stores/project-store'
import { EmptyState } from '../common/EmptyState'
import { TableroDeHallazgos } from './TableroDeHallazgos'

export function ScanView(): React.JSX.Element {
  const project = useActiveProject()
  // Antes del return temprano: los hooks no se saltan. `--cabecera` es el alto
  // real del bloque fijo, y de el cuelga la fila de columnas de la tabla.
  const [cabecera, bajoLaCabecera] = useFranjaFija('--cabecera')

  if (!project) {
    return (
      <EmptyState
        iconName="shield"
        title="Ningun proyecto seleccionado"
        hint="Agrega un proyecto y elige cual quieres auditar."
      />
    )
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto" style={bajoLaCabecera}>
      <TableroDeHallazgos project={project} cabecera={cabecera} />
    </div>
  )
}
