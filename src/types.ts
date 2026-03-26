import type { createOpencodeClient } from "@opencode-ai/sdk"

/**
 * Configuration loaded from ~/.config/opencode/smart-title.jsonc
 */
export interface SmartTitleConfig {
  /** Enable or disable the plugin. Default: true */
  enabled?: boolean
  /** Enable debug-level logging. Default: false */
  debug?: boolean
  /** Model override in "providerID/modelID" format */
  model?: string
  /** Max conversation turns to include in the prompt. Default: 10 */
  maxTurns?: number
  /** Update title every N idle events. Default: 2 */
  updateThreshold?: number
  /** Max characters per message part in the prompt. Default: 300 */
  maxCharsPerPart?: number
  /** Debounce delay in ms for idle events. Default: 1500 */
  debounceMs?: number
}

/**
 * Resolved (with defaults applied) configuration
 */
export interface ResolvedConfig {
  enabled: boolean
  debug: boolean
  model: string | undefined
  maxTurns: number
  updateThreshold: number
  maxCharsPerPart: number
  debounceMs: number
}

/**
 * Parsed model identifier
 */
export interface ModelRef {
  providerID: string
  modelID: string
}

/**
 * OpenCode SDK client type
 */
export type OpencodeClient = ReturnType<typeof createOpencodeClient>

/**
 * Log level type
 */
export type LogLevel = "debug" | "info" | "warn" | "error"
