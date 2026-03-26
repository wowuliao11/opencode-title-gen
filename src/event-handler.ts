import type { OpencodeClient, ResolvedConfig } from "./types.js"
import type { Logger } from "./logger.js"
import { isDefaultTitle, extractConversation } from "./utils.js"
import { generateTitle } from "./title-generator.js"
import { parseModel } from "./config.js"

const inflight = new Set<string>()
const idleCount = new Map<string, number>()
const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

function extractSessionID(event: {
  type: string
  properties: Record<string, unknown>
}): string | undefined {
  if (event.type === "session.idle") {
    return event.properties.sessionID as string | undefined
  }

  if (event.type === "session.status") {
    const status = event.properties.status as { type?: string } | undefined
    if (status?.type === "idle") {
      return event.properties.sessionID as string | undefined
    }
  }

  return undefined
}

export function createEventHandler(client: OpencodeClient, config: ResolvedConfig, log: Logger) {
  const modelRef = parseModel(config.model)

  return async (input: { event: { type: string; properties: Record<string, unknown> } }) => {
    const { event } = input
    await log.debug("event received", { type: event.type })

    const sessionID = extractSessionID(event)
    if (!sessionID) return

    await log.debug("idle event detected", {
      sessionID,
      eventType: event.type,
    })

    if (inflight.has(sessionID)) {
      await log.debug("already in-flight, skipping", { sessionID })
      return
    }

    const count = (idleCount.get(sessionID) ?? 0) + 1
    idleCount.set(sessionID, count)

    if (count % config.updateThreshold !== 0) {
      await log.debug("threshold not reached", {
        sessionID,
        count,
        threshold: config.updateThreshold,
      })
      return
    }

    const existing = debounceTimers.get(sessionID)
    if (existing) clearTimeout(existing)

    debounceTimers.set(
      sessionID,
      setTimeout(() => {
        debounceTimers.delete(sessionID)
        void handleSession(sessionID)
      }, config.debounceMs),
    )
  }

  async function handleSession(sessionID: string): Promise<void> {
    if (inflight.has(sessionID)) return
    inflight.add(sessionID)

    try {
      const sessionRes = await client.session.get({ path: { id: sessionID } })
      if (!sessionRes.data) {
        await log.warn("could not fetch session", { sessionID })
        return
      }

      const session = sessionRes.data
      await log.debug("session fetched", {
        sessionID,
        title: session.title,
        hasParent: !!session.parentID,
      })

      if (session.parentID) {
        await log.debug("skipping child session", {
          sessionID,
          parentID: session.parentID,
        })
        return
      }

      const existingTitle = session.title ?? ""
      if (existingTitle && !isDefaultTitle(existingTitle)) {
        await log.debug("session has custom title, skipping", {
          sessionID,
          existingTitle,
        })
        return
      }

      const msgsRes = await client.session.messages({
        path: { id: sessionID },
      })
      if (!msgsRes.data || msgsRes.data.length === 0) {
        await log.debug("no messages found, skipping", { sessionID })
        return
      }

      const messages = msgsRes.data as Array<{
        info: { role: string }
        parts: Array<{ type: string; text?: string; synthetic?: boolean }>
      }>
      await log.debug("messages fetched", {
        sessionID,
        count: messages.length,
      })

      const conversationText = extractConversation(
        messages,
        config.maxTurns,
        config.maxCharsPerPart,
      )
      if (!conversationText.trim()) {
        await log.debug("no text content extracted, skipping", { sessionID })
        return
      }

      await log.info("generating title", {
        sessionID,
        textLength: conversationText.length,
      })

      const title = await generateTitle(client, conversationText, modelRef, log)

      if (title) {
        await client.session.update({
          path: { id: sessionID },
          body: { title },
        })
        await log.info("title updated", { sessionID, title })
      } else {
        await log.warn("title generation returned empty", { sessionID })
      }
    } catch (err) {
      await log.error("title generation failed", {
        sessionID,
        error: err instanceof Error ? err.message : String(err),
      })
    } finally {
      inflight.delete(sessionID)
    }
  }
}
