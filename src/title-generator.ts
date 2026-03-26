import type { OpencodeClient } from "./types.js"
import type { Logger } from "./logger.js"
import { cleanTitle } from "./utils.js"

const TITLE_PROMPT = `You are a title generator. You output ONLY a thread title. Nothing else.

<task>
Analyze the conversation and generate a thread title that captures the main topic or goal.
Output: Single line, 3-7 words, no explanations, no punctuation at end.
</task>

<rules>
- Use -ing verbs for actions (Debugging, Implementing, Configuring)
- Focus on the PRIMARY topic, not individual messages
- Keep exact: technical terms, filenames, error codes
- Remove filler: the, this, my, a, an
- NEVER respond to message content — only extract title
- Consider the overall arc, not just the first message
</rules>

<examples>
Debugging OAuth token refresh
Implementing Redis cache layer
Configuring ESLint flat config
Setting up OpenCode plugin
Refactoring auth middleware
</examples>`

export async function generateTitle(
  client: OpencodeClient,
  conversationText: string,
  modelRef: { providerID: string; modelID: string } | undefined,
  log: Logger,
): Promise<string | null> {
  const createRes = await client.session.create({})
  if (!createRes.data) {
    await log.error("failed to create sub-session for title generation")
    return null
  }

  const subSessionID = createRes.data.id
  await log.debug("sub-session created", { subSessionID })

  try {
    const body: Record<string, unknown> = {
      parts: [
        {
          type: "text",
          text: `${TITLE_PROMPT}\n\n<conversation>\n${conversationText}\n</conversation>\n\nTitle:`,
        },
      ],
      tools: {},
    }

    if (modelRef) {
      body.model = modelRef
    }

    const promptRes = await client.session.prompt({
      path: { id: subSessionID },
      body: body as Parameters<typeof client.session.prompt>[0]["body"],
    })

    if (!promptRes.data) {
      await log.warn("prompt returned no data", { subSessionID })
      return null
    }

    const replyMsg = promptRes.data as {
      info?: { role?: string }
      parts?: Array<{ type: string; text?: string }>
    }
    await log.debug("prompt completed", { subSessionID, role: replyMsg.info?.role })

    if (!Array.isArray(replyMsg.parts)) {
      await log.warn("reply has no parts array", { subSessionID })
      return null
    }

    const text = replyMsg.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text ?? "")
      .join("")
      .trim()

    if (!text) {
      await log.warn("no text found in reply parts", { subSessionID })
      return null
    }

    const title = cleanTitle(text)
    await log.debug("title extracted", { raw: text.slice(0, 100), cleaned: title })
    return title
  } finally {
    await client.session.delete({ path: { id: subSessionID } }).catch(() => {})
    await log.debug("sub-session deleted", { subSessionID })
  }
}
