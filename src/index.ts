import type { Plugin } from "@opencode-ai/plugin"
import { loadConfig } from "./config.js"
import { createLogger } from "./logger.js"
import { createEventHandler } from "./event-handler.js"

const plugin: Plugin = async ({ client }) => {
  const config = loadConfig()
  const log = createLogger(client, config.debug)

  await log.info("plugin loaded", {
    enabled: config.enabled,
    debug: config.debug,
    mode: config.mode,
    maxTurns: config.maxTurns,
    updateThreshold: config.updateThreshold,
    maxCharsPerPart: config.maxCharsPerPart,
    debounceMs: config.debounceMs,
    model: config.model ?? "(default)",
  })

  if (!config.enabled) {
    await log.info("plugin disabled via config")
    return {}
  }

  const eventHandler = createEventHandler(client, config, log)

  return {
    event: eventHandler,
  }
}

export default plugin
