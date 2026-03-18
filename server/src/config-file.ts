import fs from "node:fs";
import { nexioConfigSchema, type NexioConfig } from "@nexioai/shared";
import { resolveNexioConfigPath } from "./paths.js";

export function readConfigFile(): NexioConfig | null {
  const configPath = resolveNexioConfigPath();

  if (!fs.existsSync(configPath)) return null;

  try {
    const raw = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    return nexioConfigSchema.parse(raw);
  } catch {
    return null;
  }
}
