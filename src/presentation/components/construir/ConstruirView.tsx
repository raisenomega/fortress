import { useEffect } from 'react'
import { barrerVaciosUnaVez } from '../../services/limpiar-vacios'
import { alMorirElDraft, parDeLaVista, rehidratar } from '../../services/rehidratar-el-hilo'
import { useActiveProject } from '../../stores/project-store'
import { useBarraStore } from '../../stores/barra-store'
import { useConstruirStore } from '../../stores/construir-store'
import { BarraDelChat } from './BarraDelChat'
import { BarraToggle } from './BarraToggle'
import { ConfigInterview } from './ConfigInterview'
import { CuerpoDelChat } from './CuerpoDelChat'

/**
 * Construir: chat abierto A LO ANCHO como el Terminal (PASO 84), con el input
 * abajo. La flecha elige el modo (Plan / Investigacion / Ejecutor / Libre).
 * El CARVE-OUT de proyecto+confianza vale SOLO para 'libre' (PASO 91): un chat
 * powers-off sin repo no tiene nada que proteger. Los otros tres modos siguen
 * exigiendo proyecto de confianza EXACTAMENTE como siempre.
 */
export function ConstruirView(): React.JSX.Element {
  const project = useActiveProject()
  const mode = useConstruirStore((s) => s.mode)
  const barraAbierta = useBarraStore((s) => s.abierta)
  const libre = mode === 'libre'

  // B1 + Revision A: PRIMERO el barrido de vacios (el «cerrar» del contrato
  // corre al arrancar, una vez) y DESPUES la rehidratacion del par — asi el
  // par jamas pinta un hilo que el barrido esta por llevarse.
  useEffect(() => {
    void barrerVaciosUnaVez()
      .catch(console.error)
      .then(() => rehidratar(parDeLaVista(project?.id ?? null, mode)))
  }, [project?.id, mode])

  // PASO 110: una rehidratacion saltada por la guarda jamas se pierde — al
  // morir el draft se rehace con el par ACTUAL (la senal decide; feliz = noop).
  const draft = useConstruirStore((s) => s.draft)
  useEffect(() => {
    if (draft === null) void alMorirElDraft(parDeLaVista(project?.id ?? null, mode))
  }, [draft, project?.id, mode])

  // Un proyecto sin marco aprobado: aqui ocurre su entrevista de configuracion.
  if (project?.configState === 'PENDIENTE_CONFIGURACION') {
    return <ConfigInterview projectId={project.id} />
  }

  return (
    <div className="flex h-full w-full flex-row">
      {barraAbierta && <BarraDelChat />}
      <div className="flex h-full min-w-0 flex-1 flex-col px-4 pt-4 pb-6">
        <div className="flex items-center pb-2">
          <BarraToggle />
          <p className="flex-1 text-center text-[11px] text-muted-foreground">
            {libre
              ? 'Chat libre — global, sin proyecto · conversa sin repo'
              : `Chat de ${project?.name ?? ''}`}
          </p>
          <span className="w-7 shrink-0" aria-hidden />
        </div>
        <CuerpoDelChat project={project} libre={libre} />
      </div>
    </div>
  )
}
