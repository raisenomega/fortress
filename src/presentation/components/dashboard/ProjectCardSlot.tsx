import { useRef, useState } from 'react'
import type { Project } from '@domain/project/project'
import { useBreakdownStore } from '../../stores/breakdown-store'
import { BreakdownPopover } from './BreakdownPopover'
import { BreakdownToggle } from './BreakdownToggle'
import { ProjectCard } from './ProjectCard'

interface ProjectCardSlotProps {
  readonly project: Project
  readonly active: boolean
  readonly onSelect: (id: string) => void
}

/**
 * Envuelve la tarjeta con su chevron y el popover flotante del desglose. El clic
 * normal en la tarjeta sigue seleccionando; el chevron abre/cierra el popover.
 */
export function ProjectCardSlot({
  project,
  active,
  onSelect
}: ProjectCardSlotProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)
  const [anchor, setAnchor] = useState<DOMRect | null>(null)
  const open = useBreakdownStore((state) => state.openProjectId === project.id)
  const toggle = useBreakdownStore((state) => state.toggle)

  const onToggle = (): void => {
    if (ref.current) setAnchor(ref.current.getBoundingClientRect())
    toggle(project.id)
  }

  return (
    <div ref={ref} className="relative shrink-0">
      <ProjectCard project={project} active={active} onSelect={onSelect} />
      <BreakdownToggle open={open} onToggle={onToggle} />
      {open && anchor ? <BreakdownPopover project={project} anchor={anchor} /> : null}
    </div>
  )
}
