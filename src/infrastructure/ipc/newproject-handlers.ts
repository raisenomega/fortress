import { ipcMain } from 'electron'
import { createFolder, planFolder, type FolderTools } from '@application/newproject/prepare-folder'
import { executeConfiguration } from '@application/newproject/execute-configuration'
import {
  registerEmptyProject,
  type EmptyProjectInput
} from '@application/newproject/register-empty-project'
import type { NewProjectDraft } from '@domain/newproject/new-project-draft'
import { err } from '@domain/shared/result'
import { gitInit } from '../git/git-init'
import { createProjectFolder, describeExisting } from '../newproject/create-folder'
import { listProjectDocs, readProjectDoc } from '../newproject/docs-reader'
import { createGovernanceWriter } from '../newproject/governance-writer'
import { homeDirs } from '../newproject/home-dirs'
import { getAppContext } from '../persistence/app-context'
import { IPC } from './channels'

const TOOLS: FolderTools = { describeExisting, create: createProjectFolder }

export function registerNewProjectHandlers(): void {
  ipcMain.handle(IPC.newProjectHomeDirs, () => homeDirs())

  ipcMain.handle(IPC.newProjectPlanFolder, (_event, draft: NewProjectDraft) =>
    planFolder(TOOLS, draft)
  )

  ipcMain.handle(
    IPC.newProjectCreateFolder,
    (_event, draft: NewProjectDraft, useExisting: boolean) =>
      createFolder(TOOLS, draft, useExisting)
  )

  ipcMain.handle(IPC.newProjectRegister, (_event, input: EmptyProjectInput) =>
    registerEmptyProject(getAppContext(), gitInit, input)
  )

  ipcMain.handle(IPC.configExecute, (_event, projectId: string, drafts: Record<string, string>) =>
    executeConfiguration(getAppContext(), createGovernanceWriter(), projectId, drafts)
  )

  ipcMain.handle(IPC.docsList, (_event, projectId: string) => {
    const project = getAppContext().projects.findById(projectId)
    return project ? listProjectDocs(project.path) : []
  })

  ipcMain.handle(IPC.docsRead, (_event, projectId: string, name: string) => {
    const project = getAppContext().projects.findById(projectId)
    return project ? readProjectDoc(project.path, name) : err('El proyecto ya no existe')
  })
}
