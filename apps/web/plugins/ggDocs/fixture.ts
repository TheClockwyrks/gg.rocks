// A small docs/ folder for the tests, written to a temporary directory: a
// root with its overview and two pages, and two folders of pages, one with
// its own overview.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

export const FIXTURE: Record<string, string> = {
  "overview.md": '---\ntitle: "Overview"\n---\n\nSee [agents](/gg/agents/).\n',
  "agents.md": '---\ntitle: "Agents"\n---\n\n## Slots\n',
  "compaction.md": '---\ntitle: "Compaction"\n---\n\nText.\n',
  "responses-as-code/overview.md": '---\ntitle: "Overview"\n---\n\nText.\n',
  "responses-as-code/invariants.md": '---\ntitle: "Invariants"\n---\n\nT.\n',
  "languages/rust.md": '---\ntitle: "Rust"\n---\n\nText.\n',
  "languages/c.md": '---\ntitle: "C"\n---\n\nText.\n',
  "languages/notes.txt": "not a page\n",
};

/** Writes the fixture (or `files`) and returns the folder holding `docs/`. */
export function writeFixture(files: Record<string, string> = FIXTURE): string {
  const root = mkdtempSync(path.join(tmpdir(), "gg-docs-"));
  for (const [rel, text] of Object.entries(files)) {
    const file = path.join(root, "docs", rel);
    mkdirSync(path.dirname(file), { recursive: true });
    writeFileSync(file, text);
  }
  return root;
}
