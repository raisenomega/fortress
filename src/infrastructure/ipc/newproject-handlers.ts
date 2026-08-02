import { ipcMain } from 'electron'
import { createFolder, planFolder, type FolderTools } from '@application/newproject/prepare-folder'
import type { NewProjectDraft } from '@domain/newproject/new-project-draft'
import { createProjectFolder, describeExisting } from '../newproject/create-folder'
import { homeDirs } from '../newproject/home-dirs'
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
}
