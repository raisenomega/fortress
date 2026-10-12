import type { ProyectoEnVista } from '@domain/project/proyecto-en-vista'

interface AvisoClienteContaminadoProps {
  readonly project: ProyectoEnVista
}

const CAJA =
  'max-h-32 overflow-y-auto rounded border border-border bg-background/40 p-2 font-mono text-[10px] break-words text-muted-foreground'

/**
 * PASO 172a: aviso NO bloqueante para un proyecto CLIENTE contaminado. El
 * cliente trabaja igual (no se congela); esto solo INFORMA qué detectó la última
 * auditoría de calidad. Se limpia solo cuando una auditoría posterior sale
 * limpia. Sin botón: no hay nada que desbloquear porque nunca se frenó.
 *
 * Solo para clientes: FORTRESS contaminado va por el freeze del Motor y su
 * AvisoContaminacion (self-repair, alto riesgo), no por este aviso informativo.
 */
export function AvisoClienteContaminado({
  project
}: AvisoClienteContaminadoProps): React.JSX.Element | null {
  if (!project.contaminated || project.esRepoPropio) return null

  return (
    <div role="status" className="shrink-0 border-b border-border bg-background/30 px-4 py-2">
      <p className="text-medium text-xs">
        La última auditoría de calidad detectó archivos cambiados durante el chequeo (suelen ser de
        build, regenerables). No bloquea nada: puedes seguir trabajando, y se limpia sola en la
        próxima auditoría que salga limpia.
      </p>
      <p className={CAJA}>{project.contaminationDetail ?? 'Sin detalle.'}</p>
    </div>
  )
}
