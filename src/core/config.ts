import { existsSync, readdirSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import type { Source, AsmConfig } from "../types/index.js";

export function configDir(): string {
  return process.env.ASM_CONFIG_DIR ?? join(homedir(), ".config", "asm");
}

export function configPath(): string {
  return join(configDir(), "config.json");
}

export function readConfig(): AsmConfig {
  const path = configPath();
  if (!existsSync(path)) return { sources: [] };
  return JSON.parse(readFileSync(path, "utf-8")) as AsmConfig;
}

export function writeConfig(config: AsmConfig): void {
  ensureDir(configDir());
  writeFileSync(configPath(), JSON.stringify(config, null, 2) + "\n");
}

export function addSource(source: Source): void {
  const config = readConfig();
  const idx = config.sources.findIndex((s) => s.name === source.name);
  if (idx >= 0) {
    config.sources[idx] = source;
  } else {
    config.sources.push(source);
  }
  writeConfig(config);
}

export function removeSource(name: string): void {
  const config = readConfig();
  config.sources = config.sources.filter((s) => s.name !== name);
  writeConfig(config);
}

export function listSources(): Source[] {
  return readConfig().sources;
}

export function resolveAgent(cliAgent?: string): string {
  if (cliAgent) return cliAgent;
  if (process.env.ASM_AGENT) return process.env.ASM_AGENT;

  const agentsDir = join(homedir(), ".config");
  const installed: string[] = [];

  if (existsSync(agentsDir)) {
    for (const entry of readdirSync(agentsDir, { withFileTypes: true })) {
      if (
        entry.isDirectory() &&
        existsSync(join(agentsDir, entry.name, "skills"))
      ) {
        installed.push(entry.name);
      }
    }
  }

  if (installed.length === 1) return installed[0];
  if (installed.length === 0) {
    console.error(
      "No agent detected. Use --agent <name> or set ASM_AGENT.",
    );
    process.exit(1);
  }
  console.error(
    `Multiple agents detected (${installed.join(", ")}). Use --agent <name> to specify.`,
  );
  process.exit(1);
}

export function globalSkillsDir(agent: string): string {
  return join(homedir(), ".config", agent, "skills");
}

export function localSkillsDir(): string {
  return join(process.cwd(), "asm_modules", "skills");
}

export function resolvePackageDir(
  pkgName: string,
  options: { global?: boolean; agent?: string },
): string {
  if (options.global) {
    const agent = resolveAgent(options.agent);
    return join(globalSkillsDir(agent), pkgName);
  }
  return join(localSkillsDir(), pkgName);
}

export function ensureDir(dir: string): void {
  mkdirSync(dir, { recursive: true });
}
