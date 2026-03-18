import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ensureCodexSkillsInjected } from "@nexioai/adapter-codex-local/server";

async function makeTempDir(prefix: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), prefix));
}

async function createNexioRepoSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "server"), { recursive: true });
  await fs.mkdir(path.join(root, "packages", "adapter-utils"), { recursive: true });
  await fs.mkdir(path.join(root, "skills", skillName), { recursive: true });
  await fs.writeFile(path.join(root, "pnpm-workspace.yaml"), "packages:\n  - packages/*\n", "utf8");
  await fs.writeFile(path.join(root, "package.json"), '{"name":"nexio"}\n', "utf8");
  await fs.writeFile(
    path.join(root, "skills", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

async function createCustomSkill(root: string, skillName: string) {
  await fs.mkdir(path.join(root, "custom", skillName), { recursive: true });
  await fs.writeFile(
    path.join(root, "custom", skillName, "SKILL.md"),
    `---\nname: ${skillName}\n---\n`,
    "utf8",
  );
}

describe("codex local adapter skill injection", () => {
  const cleanupDirs = new Set<string>();

  afterEach(async () => {
    await Promise.all(Array.from(cleanupDirs).map((dir) => fs.rm(dir, { recursive: true, force: true })));
    cleanupDirs.clear();
  });

  it("repairs a Codex Nexio skill symlink that still points at another live checkout", async () => {
    const currentRepo = await makeTempDir("paperclip-codex-current-");
    const oldRepo = await makeTempDir("paperclip-codex-old-");
    const skillsHome = await makeTempDir("paperclip-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(oldRepo);
    cleanupDirs.add(skillsHome);

    await createNexioRepoSkill(currentRepo, "nexio");
    await createNexioRepoSkill(oldRepo, "nexio");
    await fs.symlink(path.join(oldRepo, "skills", "nexio"), path.join(skillsHome, "nexio"));

    const logs: string[] = [];
    await ensureCodexSkillsInjected(
      async (_stream, chunk) => {
        logs.push(chunk);
      },
      {
        skillsHome,
        skillsEntries: [{ name: "nexio", source: path.join(currentRepo, "skills", "nexio") }],
      },
    );

    expect(await fs.realpath(path.join(skillsHome, "nexio"))).toBe(
      await fs.realpath(path.join(currentRepo, "skills", "nexio")),
    );
    expect(logs.some((line) => line.includes('Repaired Codex skill "nexio"'))).toBe(true);
  });

  it("preserves a custom Codex skill symlink outside Nexio repo checkouts", async () => {
    const currentRepo = await makeTempDir("paperclip-codex-current-");
    const customRoot = await makeTempDir("paperclip-codex-custom-");
    const skillsHome = await makeTempDir("paperclip-codex-home-");
    cleanupDirs.add(currentRepo);
    cleanupDirs.add(customRoot);
    cleanupDirs.add(skillsHome);

    await createNexioRepoSkill(currentRepo, "nexio");
    await createCustomSkill(customRoot, "nexio");
    await fs.symlink(path.join(customRoot, "custom", "nexio"), path.join(skillsHome, "nexio"));

    await ensureCodexSkillsInjected(async () => {}, {
      skillsHome,
      skillsEntries: [{ name: "nexio", source: path.join(currentRepo, "skills", "nexio") }],
    });

    expect(await fs.realpath(path.join(skillsHome, "nexio"))).toBe(
      await fs.realpath(path.join(customRoot, "custom", "nexio")),
    );
  });
});
