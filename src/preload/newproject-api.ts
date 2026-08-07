import type { FolderPlan } from '@application/newproject/prepare-folder'
import type { EmptyProjectInput } from '@application/newproject/register-empty-project'
import type { NewProjectDraft } from '@domain/newproject/new-project-draft'
import type { Project } from '@domain/project/project'
import type { Result } from '@domain/shared/result'

export interface HomeDir {
  readonly label: string
  readonly path: string
}

export interface NewProjectApi {
  /** Atajos a Escritorio, Documentos y la carpeta personal. */
  homeDirs(): Promise<readonly HomeDir[]>
  /** Que ruta saldria, y que hay dentro si ya existe. No crea nada. */
  planFolder(draft: NewProjectDraft): Promise<Result<FolderPlan>>
  createFolder(draft: NewProjectDraft, useExisting: boolean): Promise<Result<string>>
  /** Inicia git y registra el proyecto vacio en PENDIENTE_CONFIGURACION. */
  register(input: EmptyProjectInput): Promise<Result<Project>>
  /** "Si, ejecutar": escribe el marco aprobado en disco, commitea y CONFIGURA. */
  execute(projectId: string, drafts: Record<string, string>): Promise<Result<string>>
}

/** Visor de documentacion del proyecto: lee los .md de la raiz IN-APP. */
export interface DocsApi {
  list(projectId: string): Promise<readonly string[]>
  read(projectId: string, name: string): Promise<Result<string>>
}
