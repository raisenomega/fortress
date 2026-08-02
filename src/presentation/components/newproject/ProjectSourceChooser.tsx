import { FolderOpen, Sparkles } from 'lucide-react'
import { Modal } from '../common/Modal'

interface ProjectSourceChooserProps {
  readonly onConnect: () => void
  readonly onCreate: () => void
  readonly onClose: () => void
}

interface OptionProps {
  readonly icon: React.ReactNode
  readonly title: string
  readonly hint: string
  readonly onClick: () => void
}

function Option({ icon, title, hint, onClick }: OptionProps): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      className="tap flex w-full items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3 text-left hover:border-primary/50"
    >
      <span className="mt-0.5 shrink-0 text-primary">{icon}</span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{title}</span>
        <span className="block text-xs text-muted-foreground">{hint}</span>
      </span>
    </button>
  )
}

export function ProjectSourceChooser({
  onConnect,
  onCreate,
  onClose
}: ProjectSourceChooserProps): React.JSX.Element {
  return (
    <Modal title="Agregar proyecto" onClose={onClose}>
      <div className="space-y-2">
        <Option
          icon={<FolderOpen size={16} aria-hidden />}
          title="Conectar un proyecto existente"
          hint="Eliges una carpeta que ya tienes y FORTRESS la audita."
          onClick={onConnect}
        />
        <Option
          icon={<Sparkles size={16} aria-hidden />}
          title="Crear un proyecto desde cero"
          hint="FORTRESS crea la carpeta, la documentacion y el andamiaje, con los agentes activos desde el primer commit."
          onClick={onCreate}
        />
      </div>
    </Modal>
  )
}
