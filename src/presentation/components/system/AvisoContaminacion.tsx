import { useState } from 'react'
import type { Project } from '@domain/project/project'
import { desbloquearProyecto } from '../../services/project-service'
import { Icon } from '../common/Icon'
import { ConfirmDesbloqueo } from './ConfirmDesbloqueo'

interface AvisoContaminacionProps {
  readonly project: Project
}

/**
 * Por que el motor esta parado sobre este proyecto, dicho donde el chip del
 * expediente lleva a mirarlo. El bloqueo ya existia y esta vista no lo
 * mencionaba: el operador llegaba y encontraba un panel normal que no hacia
 * nada, con la razon guardada en una columna que no leia nadie.
 *
 * El aviso se apaga solo. Desbloquear recarga los proyectos y el que vuelve ya
 * no trae marca, asi que no hay que acordarse de esconder nada.
 */
export function AvisoContaminacion({ project }: AvisoContaminacionProps): React.JSX.Element {
  const [preguntando, setPreguntando] = useState(false)

  const desbloquear = (): void => {
    setPreguntando(false)
    void desbloquearProyecto(project.id)
  }

  return (
    <div role="alert" className="border-critical/40 bg-critical/10 rounded-md border p-3">
      <div className="flex items-start gap-2">
        <Icon name="alert-triangle" size={13} className="text-critical mt-0.5 shrink-0" />
        <div className="flex-1 space-y-1">
          <p className="text-foreground text-xs">
            Una auditoria altero este proyecto y las capas de restauracion no lo devolvieron byte a
            byte. El motor esta detenido sobre el hasta que revises que se cambio.
          </p>
          <p className="text-muted-foreground text-[11px]">
            Mientras dure la marca no corre ningun agente, y la firma y el push quedan frenados.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setPreguntando(true)}
          className="tap border-border text-foreground hover:bg-critical/10 shrink-0 rounded-md border px-3 py-1.5 text-xs"
        >
          Revisar y desbloquear
        </button>
      </div>

      {preguntando ? (
        <ConfirmDesbloqueo
          project={project}
          onCancel={() => setPreguntando(false)}
          onConfirm={desbloquear}
        />
      ) : null}
    </div>
  )
}
