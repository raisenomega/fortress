import { FolderOpen } from 'lucide-react'
import type { NewProject } from '@domain/project/project'
import { FIELD_CLASS, LabeledField } from '../common/LabeledField'

interface ProjectFormFieldsProps {
  readonly draft: NewProject
  readonly onChange: (draft: NewProject) => void
  readonly onPickFolder: () => void
}

export function ProjectFormFields({
  draft,
  onChange,
  onPickFolder
}: ProjectFormFieldsProps): React.JSX.Element {
  return (
    <div className="space-y-3">
      <LabeledField label="Nombre">
        <input
          value={draft.name}
          placeholder="Se rellena al elegir la carpeta"
          onChange={(event) => onChange({ ...draft, name: event.target.value })}
          className={FIELD_CLASS}
        />
      </LabeledField>

      <LabeledField label="Ruta">
        <div className="flex gap-2">
          <input
            readOnly
            value={draft.path}
            placeholder="Elige la carpeta del proyecto"
            className={`${FIELD_CLASS} font-mono text-xs`}
          />
          <button
            type="button"
            onClick={onPickFolder}
            title="Abrir el selector de carpetas del sistema"
            className="tap shrink-0 rounded-md border border-border px-3 hover:border-primary/40"
          >
            <FolderOpen size={15} aria-hidden />
          </button>
        </div>
      </LabeledField>

      <LabeledField label={`Stack${draft.stack ? ' (auto-detectado, editable)' : ''}`}>
        <input
          value={draft.stack}
          placeholder="Se detecta al elegir la carpeta"
          onChange={(event) => onChange({ ...draft, stack: event.target.value })}
          className={FIELD_CLASS}
        />
      </LabeledField>
    </div>
  )
}
