import { useState } from 'react'
import type { Result } from '@domain/shared/result'
import { api } from '../../adapters/fortress-api'
import { CampoGit } from './CampoGit'

interface GitProjectFormProps {
  readonly projectId: string
  readonly nombre: string
}

const BOTON = 'tap rounded border border-border px-2 py-1 text-xs text-foreground hover:bg-muted'

/**
 * Fijar identidad + remoto del proyecto DESDE FORTRESS (PASO 163, Sello 2a).
 * Dos escrituras LOCALES a su `.git/config`. Publicar es otro acto (el push).
 */
export function GitProjectForm({ projectId, nombre }: GitProjectFormProps): React.JSX.Element {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [url, setUrl] = useState('')
  const [estado, setEstado] = useState('')
  const mostrar = (r: Result<string>): void => setEstado(r.ok ? r.value : `Error: ${r.error}`)

  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-foreground">Git de «{nombre}»</h3>
      <p className="text-xs text-muted-foreground">
        Identidad LOCAL y remoto; no toca el git global.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <CampoGit value={name} onChange={setName} placeholder="Nombre git" />
        <CampoGit value={email} onChange={setEmail} placeholder="Correo git" />
      </div>
      <button
        type="button"
        className={BOTON}
        onClick={() => void api().projects.setIdentity(projectId, name, email).then(mostrar)}
      >
        Guardar identidad
      </button>
      <CampoGit value={url} onChange={setUrl} placeholder="URL del remoto (origin)" />
      <button
        type="button"
        className={BOTON}
        onClick={() => void api().projects.setRemote(projectId, url).then(mostrar)}
      >
        Guardar remoto
      </button>
      {estado !== '' && <p className="text-[11px] text-muted-foreground">{estado}</p>}
    </section>
  )
}
