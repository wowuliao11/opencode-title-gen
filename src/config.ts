import { readFileSync, existsSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import type { SmartTitleConfig, ResolvedConfig } from "./types.js"

const CONFIG_PATH = join(homedir(), ".config", "opencode", "smart-title.jsonc")

const DEFAULTS: ResolvedConfig = {
  enabled: true,
  debug: false,
  model: undefined,
  maxTurns: 10,
  updateThreshold: 2,
  maxCharsPerPart: 300,
  debounceMs: 1500,
}

function stripJsonComments(raw: string): string {
  return raw.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")
}

export function loadConfig(): ResolvedConfig {
  if (!existsSync(CONFIG_PATH)) return { ...DEFAULTS }

  try {
    const raw = readFileSync(CONFIG_PATH, "utf-8")
    const parsed: SmartTitleConfig = JSON.parse(stripJsonComments(raw))
    return {
      enabled: parsed.enabled ?? DEFAULTS.enabled,
      debug: parsed.debug ?? DEFAULTS.debug,
      model: parsed.model ?? DEFAULTS.model,
      maxTurns: parsed.maxTurns ?? DEFAULTS.maxTurns,
      updateThreshold: parsed.updateThreshold ?? DEFAULTS.updateThreshold,
      maxCharsPerPart: parsed.maxCharsPerPart ?? DEFAULTS.maxCharsPerPart,
      debounceMs: parsed.debounceMs ?? DEFAULTS.debounceMs,
    }
  } catch {
    return { ...DEFAULTS }
  }
}

export function parseModel(
  model: string | undefined,
): { providerID: string; modelID: string } | undefined {
  if (!model) return undefined
  const slash = model.indexOf("/")
  if (slash === -1) return undefined
  return {
    providerID: model.slice(0, slash),
    modelID: model.slice(slash + 1),
  }
}
