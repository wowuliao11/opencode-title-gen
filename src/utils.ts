const DEFAULT_TITLE_PATTERNS = [
  /^new session/i,
  /^\d{4}-\d{2}-\d{2}/,
  /^session\s+\d+$/i,
  /^untitled/i,
]

export function isDefaultTitle(title: string): boolean {
  const trimmed = title.trim()
  if (DEFAULT_TITLE_PATTERNS.some((p) => p.test(trimmed))) return true

  // OpenCode built-in titles are often verbose Chinese sentences ending with punctuation
  // e.g. "收到了 Librarian 关于 NestJS 权限验证的搜索结果。同时 clawhub 查询完毕。"
  // We do NOT override these by default — the plugin should let users decide
  // via updateThreshold whether to regenerate after built-in titles appear.
  return false
}

interface MessagePart {
  type: string
  text?: string
  synthetic?: boolean
}

interface MessageLike {
  info: { role: string }
  parts: MessagePart[]
}

interface ConversationTurn {
  user: string
  assistantFirst?: string
  assistantLast?: string
}

function extractText(parts: MessagePart[], maxChars: number): string {
  const text = parts
    .filter((p) => p.type === "text" && p.text && !p.synthetic)
    .map((p) => p.text!)
    .join(" ")
    .trim()

  return text.length > maxChars ? text.slice(0, maxChars) + "..." : text
}

export function extractConversation(
  messages: MessageLike[],
  maxTurns: number,
  maxCharsPerPart: number,
): string {
  const turns: ConversationTurn[] = []
  let current: ConversationTurn | null = null
  const assistantParts: string[] = []

  for (const msg of messages) {
    if (msg.info.role !== "user" && msg.info.role !== "assistant") continue

    if (msg.info.role === "user") {
      if (current && assistantParts.length > 0) {
        current.assistantFirst = assistantParts[0]
        current.assistantLast = assistantParts[assistantParts.length - 1]
      }
      if (current) turns.push(current)

      const text = extractText(msg.parts, maxCharsPerPart)
      if (!text) continue
      current = { user: text }
      assistantParts.length = 0
    } else {
      const text = extractText(msg.parts, maxCharsPerPart)
      if (text) assistantParts.push(text)
    }
  }

  if (current) {
    if (assistantParts.length > 0) {
      current.assistantFirst = assistantParts[0]
      current.assistantLast = assistantParts[assistantParts.length - 1]
    }
    turns.push(current)
  }

  const recent = turns.slice(-maxTurns)
  const lines: string[] = []

  for (const turn of recent) {
    lines.push(`User: ${turn.user}`)
    if (turn.assistantFirst) {
      if (turn.assistantFirst === turn.assistantLast) {
        lines.push(`Assistant: ${turn.assistantFirst}`)
      } else {
        lines.push(`Assistant (initial): ${turn.assistantFirst}`)
        lines.push(`Assistant (final): ${turn.assistantLast}`)
      }
    }
    lines.push("")
  }

  return lines.join("\n").trim()
}

export function cleanTitle(raw: string): string {
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>\s*/g, "")

  cleaned =
    cleaned
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.length > 0) ?? ""

  return cleaned
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/[.!?。！？]+$/, "")
    .replace(/^title:\s*/i, "")
    .trim()
    .slice(0, 60)
}
