import type { ChatMessage, NewChatMessage } from '@domain/chat/chat-message'
import type { ChatRepository } from '@domain/chat/chat-repository'
import { newId, nowIso } from '@domain/shared/id'
import { toChatMessage, type ChatRow } from './chat-row'
import type { Db } from './database'

const COLUMNS = 'id, project_id, role, content, agent_id, mode, engine, created_at'

export function createSqliteChatRepository(db: Db): ChatRepository {
  const selectByProject = db.prepare(
    `SELECT ${COLUMNS} FROM chat_messages WHERE project_id = ? ORDER BY created_at ASC, rowid ASC`
  )
  const selectById = db.prepare(`SELECT ${COLUMNS} FROM chat_messages WHERE id = ?`)
  const deleteByProject = db.prepare('DELETE FROM chat_messages WHERE project_id = ?')
  const insert = db.prepare(
    `INSERT INTO chat_messages (id, project_id, role, content, agent_id, mode, engine, created_at)
     VALUES (@id, @projectId, @role, @content, @agentId, @mode, @engine, @createdAt)`
  )

  return {
    listByProject: (projectId) => (selectByProject.all(projectId) as ChatRow[]).map(toChatMessage),

    add: (message: NewChatMessage): ChatMessage => {
      const id = newId()
      insert.run({
        id,
        projectId: message.projectId,
        role: message.role,
        content: message.content,
        agentId: message.agentId,
        mode: message.mode,
        engine: message.engine,
        createdAt: nowIso()
      })
      return toChatMessage(selectById.get(id) as ChatRow)
    },

    clearProject: (projectId) => {
      deleteByProject.run(projectId)
    }
  }
}
