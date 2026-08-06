import { useEffect } from 'react'
import { createFolder, refreshPlan } from '../../services/new-project-service'
import { useNewProjectStore } from '../../stores/new-project-store'
import { FIELD_CLASS, LabeledField } from '../common/LabeledField'
import { Modal } from '../common/Modal'
import { Notice } from '../common/Notice'
import { DestinationPicker } from './DestinationPicker'
import { StepActions } from './StepActions'
import { TargetPreview } from './TargetPreview'

interface NewProjectFolderStepProps {
  readonly onClose: () => void
}

/**
 * Primer paso: donde va a vivir el proyecto. Antes de generar un solo archivo
 * hay que saber la ruta, y el operador tiene que verla escrita entera.
 */
export function NewProjectFolderStep({ onClose }: NewProjectFolderStepProps): React.JSX.Element {
  const draft = useNewProjectStore((state) => state.draft)
  const target = useNewProjectStore((state) => state.target)
  const error = useNewProjectStore((state) => state.error)
  const patch = useNewProjectStore((state) => state.patch)

  useEffect(() => {
    void refreshPlan(draft)
  }, [draft])

  return (
    <Modal title="Crear proyecto desde cero" onClose={onClose}>
      <div className="space-y-4">
        <LabeledField label="Nombre del proyecto">
          <input
            autoFocus
            value={draft.name}
            placeholder="Mi App Genial"
            onChange={(event) => patch({ name: event.target.value })}
            className={FIELD_CLASS}
          />
        </LabeledField>

        <LabeledField label="Crear dentro de">
          <DestinationPicker value={draft.parentDir} onPick={(parentDir) => patch({ parentDir })} />
        </LabeledField>

        <TargetPreview />
        {error ? <Notice tone="error">{error}</Notice> : null}

        <StepActions
          confirmLabel="Crear proyecto"
          disabled={target === null}
          onCancel={onClose}
          onConfirm={() => void createFolder()}
        />
      </div>
    </Modal>
  )
}
