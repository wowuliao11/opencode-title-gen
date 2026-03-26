import { describe, test, expect } from "vitest"
import { isDefaultTitle, extractConversation, cleanTitle } from "../src/utils.js"

describe("isDefaultTitle", () => {
  test("matches 'New Session' variants", () => {
    expect(isDefaultTitle("New Session")).toBe(true)
    expect(isDefaultTitle("new session")).toBe(true)
    expect(isDefaultTitle("NEW SESSION")).toBe(true)
    expect(isDefaultTitle("New session - 2026-03-26T04:39:41.320Z")).toBe(true)
  })

  test("matches date-prefixed titles", () => {
    expect(isDefaultTitle("2026-03-22")).toBe(true)
    expect(isDefaultTitle("2026-03-22 10:30")).toBe(true)
  })

  test("matches 'Session N'", () => {
    expect(isDefaultTitle("Session 1")).toBe(true)
    expect(isDefaultTitle("session 42")).toBe(true)
  })

  test("matches 'Untitled'", () => {
    expect(isDefaultTitle("Untitled")).toBe(true)
    expect(isDefaultTitle("untitled session")).toBe(true)
  })

  test("rejects custom titles", () => {
    expect(isDefaultTitle("Fix auth middleware")).toBe(false)
    expect(isDefaultTitle("Refactor database layer")).toBe(false)
    expect(isDefaultTitle("Debug CSS grid layout")).toBe(false)
  })

  test("does not treat built-in verbose titles as default", () => {
    expect(isDefaultTitle("收到了 Librarian 关于 NestJS 权限验证的搜索结果")).toBe(false)
    expect(isDefaultTitle("Debugging OAuth token refresh")).toBe(false)
  })

  test("handles empty and whitespace", () => {
    expect(isDefaultTitle("")).toBe(false)
    expect(isDefaultTitle("   ")).toBe(false)
  })
})

describe("extractConversation", () => {
  const makeMsg = (role: string, text: string, synthetic = false) => ({
    info: { role },
    parts: [{ type: "text", text, synthetic }],
  })

  test("extracts user and single assistant turn", () => {
    const msgs = [makeMsg("user", "Hello"), makeMsg("assistant", "Hi there")]
    const result = extractConversation(msgs, 10, 500)
    expect(result).toContain("User: Hello")
    expect(result).toContain("Assistant: Hi there")
  })

  test("uses first/last compression for multiple assistant messages in one turn", () => {
    const msgs = [
      makeMsg("user", "Explain auth"),
      makeMsg("assistant", "First I'll check the code"),
      makeMsg("assistant", "Middle step"),
      makeMsg("assistant", "Final answer about auth"),
    ]
    const result = extractConversation(msgs, 10, 500)
    expect(result).toContain("User: Explain auth")
    expect(result).toContain("Assistant (initial): First I'll check the code")
    expect(result).toContain("Assistant (final): Final answer about auth")
    expect(result).not.toContain("Middle step")
  })

  test("does not duplicate when assistant has exactly one message", () => {
    const msgs = [makeMsg("user", "Hello"), makeMsg("assistant", "Only response")]
    const result = extractConversation(msgs, 10, 500)
    expect(result).toContain("Assistant: Only response")
    expect(result).not.toContain("(initial)")
    expect(result).not.toContain("(final)")
  })

  test("respects maxTurns — takes the most recent turns", () => {
    const msgs = [
      makeMsg("user", "Q1"),
      makeMsg("assistant", "A1"),
      makeMsg("user", "Q2"),
      makeMsg("assistant", "A2"),
      makeMsg("user", "Q3"),
      makeMsg("assistant", "A3"),
    ]
    const result = extractConversation(msgs, 2, 500)
    expect(result).not.toContain("Q1")
    expect(result).toContain("Q2")
    expect(result).toContain("Q3")
  })

  test("truncates long message parts", () => {
    const longText = "a".repeat(600)
    const msgs = [makeMsg("user", longText)]
    const result = extractConversation(msgs, 10, 100)
    expect(result.length).toBeLessThan(120)
    expect(result).toContain("...")
  })

  test("filters out synthetic parts", () => {
    const msgs = [
      {
        info: { role: "assistant" },
        parts: [
          { type: "text", text: "Real text", synthetic: false },
          { type: "text", text: "Synthetic text", synthetic: true },
        ],
      },
      makeMsg("user", "Question"),
    ]
    const result = extractConversation(msgs, 10, 500)
    expect(result).not.toContain("Synthetic text")
  })

  test("skips system messages", () => {
    const msgs = [makeMsg("system", "You are helpful"), makeMsg("user", "Hello")]
    const result = extractConversation(msgs, 10, 500)
    expect(result).toContain("User: Hello")
    expect(result).not.toContain("system")
    expect(result).not.toContain("helpful")
  })

  test("skips messages with no text parts", () => {
    const msgs = [
      { info: { role: "user" }, parts: [{ type: "tool_use", text: undefined }] },
      makeMsg("user", "Real message"),
    ]
    const result = extractConversation(msgs, 10, 500)
    expect(result).toContain("User: Real message")
  })

  test("includes trailing user turn without assistant response", () => {
    const msgs = [
      makeMsg("user", "First question"),
      makeMsg("assistant", "First answer"),
      makeMsg("user", "Second question"),
    ]
    const result = extractConversation(msgs, 10, 500)
    expect(result).toContain("User: Second question")
  })

  test("returns empty string for empty input", () => {
    expect(extractConversation([], 10, 500)).toBe("")
  })
})

describe("cleanTitle", () => {
  test("removes surrounding quotes", () => {
    expect(cleanTitle('"Fix auth bug"')).toBe("Fix auth bug")
    expect(cleanTitle("'Fix auth bug'")).toBe("Fix auth bug")
    expect(cleanTitle("`Fix auth bug`")).toBe("Fix auth bug")
  })

  test("removes trailing punctuation including CJK", () => {
    expect(cleanTitle("Fix auth bug.")).toBe("Fix auth bug")
    expect(cleanTitle("Fix auth bug!")).toBe("Fix auth bug")
    expect(cleanTitle("Fix auth bug?")).toBe("Fix auth bug")
    expect(cleanTitle("修复认证问题。")).toBe("修复认证问题")
    expect(cleanTitle("修复认证问题！")).toBe("修复认证问题")
  })

  test("removes 'Title:' prefix", () => {
    expect(cleanTitle("Title: Fix auth bug")).toBe("Fix auth bug")
    expect(cleanTitle("title: Fix auth bug")).toBe("Fix auth bug")
  })

  test("takes first non-empty line", () => {
    expect(cleanTitle("First line\nSecond line")).toBe("First line")
    expect(cleanTitle("\n\nActual title\nExtra")).toBe("Actual title")
  })

  test("strips thinking tags", () => {
    expect(cleanTitle("<think>some reasoning</think>Actual title")).toBe("Actual title")
    expect(cleanTitle("<think>\nmulti\nline\n</think>\nActual title")).toBe("Actual title")
  })

  test("limits to 60 chars", () => {
    const long = "a".repeat(100)
    expect(cleanTitle(long).length).toBe(60)
  })

  test("trims whitespace", () => {
    expect(cleanTitle("  Fix auth bug  ")).toBe("Fix auth bug")
  })
})
