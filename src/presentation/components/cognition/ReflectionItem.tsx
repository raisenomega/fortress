import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { CognitionReflection } from '@domain/cognition/cognition-log'

interface ReflectionItemProps {
  readonly reflection: CognitionReflection
}

export function ReflectionItem({ reflection }: ReflectionItemProps): React.JSX.Element {
  const [open, setOpen] = useState(false)

  return (
    <li className="rounded-md border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="tap flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        {open ? <ChevronDown size={13} aria-hidden /> : <ChevronRight size={13} aria-hidden />}
        <span className="font-mono text-[11px] text-primary">{reflection.session}</span>
        <span className="truncate text-xs text-foreground">{reflection.project}</span>
      </button>

      {open ? (
        <pre className="border-t border-border px-3 py-2 text-[11px] whitespace-pre-wrap text-muted-foreground">
          {reflection.body}
        </pre>
      ) : null}
    </li>
  )
}
