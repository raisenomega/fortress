import { useEffect, useState } from 'react'
import type { CapabilityNote } from '@domain/system/capability-note'
import { addCapabilityNote, fetchCapabilityNotes } from '../../services/self-improvement-service'

interface CapabilityNotesProps {
  readonly capabilityId: string
}

/** Notas de refuerzo (dato seed) que agentes u operador dejan hacia la capacidad. */
export function CapabilityNotes({ capabilityId }: CapabilityNotesProps): React.JSX.Element {
  const [notes, setNotes] = useState<readonly CapabilityNote[]>([])
  const [text, setText] = useState('')

  useEffect(() => {
    void fetchCapabilityNotes(capabilityId).then(setNotes)
  }, [capabilityId])

  const submit = (): void => {
    if (text.trim().length === 0) return
    void addCapabilityNote({ capabilityId, author: 'operador', note: text.trim() }).then((list) => {
      setNotes(list)
      setText('')
    })
  }

  return (
    <div className="border-t border-border pt-3">
      <p className="mb-1 text-[11px] text-foreground">Refuerzo de aprendizaje</p>
      <div className="mb-2 flex gap-2">
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Deja una nota que la oriente"
          className="min-w-0 flex-1 rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
        />
        <button
          type="button"
          onClick={submit}
          className="rounded bg-primary/10 px-2 py-1 text-primary hover:bg-primary/20"
        >
          Anadir
        </button>
      </div>
      <ul className="space-y-1">
        {notes.map((note) => (
          <li key={note.id} className="text-[11px] text-muted-foreground">
            <span className="text-foreground">{note.author}:</span> {note.note}
          </li>
        ))}
      </ul>
    </div>
  )
}
