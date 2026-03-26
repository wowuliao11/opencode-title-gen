import type { OpencodeClient, LogLevel } from "./types.js"

export interface Logger {
  debug(message: string, extra?: Record<string, unknown>): Promise<void>
  info(message: string, extra?: Record<string, unknown>): Promise<void>
  warn(message: string, extra?: Record<string, unknown>): Promise<void>
  error(message: string, extra?: Record<string, unknown>): Promise<void>
}

const SERVICE = "smart-title"

export function createLogger(client: OpencodeClient, debugEnabled: boolean): Logger {
  const log = async (
    level: LogLevel,
    message: string,
    extra?: Record<string, unknown>,
  ): Promise<void> => {
    if (level === "debug" && !debugEnabled) return
    try {
      await client.app.log({ body: { service: SERVICE, level, message, extra } })
    } catch {
      // Swallow log errors — never crash the plugin for a log failure
    }
  }

  return {
    debug: (msg, extra) => log("debug", msg, extra),
    info: (msg, extra) => log("info", msg, extra),
    warn: (msg, extra) => log("warn", msg, extra),
    error: (msg, extra) => log("error", msg, extra),
  }
}
