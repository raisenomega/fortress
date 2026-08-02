import { useUiStore } from '../../stores/ui-store'
import { AddProjectDialog } from '../projects/AddProjectDialog'
import { NewProjectFolderStep } from './NewProjectFolderStep'
import { ProjectSourceChooser } from './ProjectSourceChooser'

/** Los tres pasos de agregar proyecto: elegir, conectar o crear desde cero. */
export function ProjectDialogs(): React.JSX.Element | null {
  const dialog = useUiStore((state) => state.projectDialog)
  const setDialog = useUiStore((state) => state.setProjectDialog)
  const close = (): void => setDialog(null)

  if (dialog === 'chooser') {
    return (
      <ProjectSourceChooser
        onConnect={() => setDialog('connect')}
        onCreate={() => setDialog('create')}
        onClose={close}
      />
    )
  }

  if (dialog === 'connect') return <AddProjectDialog onClose={close} />
  if (dialog === 'create') return <NewProjectFolderStep onClose={close} />

  return null
}
