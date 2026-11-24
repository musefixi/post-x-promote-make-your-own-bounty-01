// Entry validator for the make.fun "Promote make.fun's make-your-own-bounty
// post on X" bounty (post-x-promote-make-your-own-bounty-01).
//
// The entry itself is one public quote post on X carrying a photo, the
// make.fun name (or @makefunai) and the entrant's play code; its address is
// recorded in POST.json at this repository's root. This program is the
// entry's runnable piece: it reads POST.json, checks that the recorded post
// address is a well-formed public X status URL, and writes a deterministic
// report to the output directory. It makes no network calls, reads no clock
// and uses no randomness, so two runs on the same repository produce the
// same report.
//
// Run:  node main.ts
// (The grader runs it as `node /bot/main.ts` with MAKEFUN_OUTPUT_DIR set.)

import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const COMPETITION = "post-x-promote-make-your-own-bounty-01";
const BOUNTY_URL = "https://make.fun/bounty/post-x-promote-make-your-own-bounty-01";

const STATUS_RE =
  /^https:\/\/(x\.com|twitter\.com)\/([A-Za-z0-9_]{1,15})\/status\/(\d{10,25})$/;

type PostLink = { url: string };

function loadPostLink(root: string): PostLink {
  const raw = readFileSync(join(root, "POST.json"), "utf8");
  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("POST.json must be a JSON object");
  }
  const url = (parsed as Record<string, unknown>).url;
  if (typeof url !== "string" || url.length === 0) {
    throw new Error("POST.json must carry a string field 'url'");
  }
  return { url };
}

function describePost(handle: string, statusId: string): string {
  return `quote post by @${handle} (status ${statusId})`;
}

function main(): void {
  const root = dirname(fileURLToPath(import.meta.url));
  const link = loadPostLink(root);
  const match = STATUS_RE.exec(link.url);
  if (match === null) {
    throw new Error(`POST.json url is not a public X status URL: ${link.url}`);
  }
  const [, host, handle, statusId] = match;
  const report = {
    competition: COMPETITION,
    bounty: BOUNTY_URL,
    post: { url: link.url, host, handle, status_id: statusId },
    summary: describePost(handle, statusId),
    validated: true,
  };
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? join(root, "output");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "report.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log(`validated ${link.url} -> ${join(outDir, "report.json")}`);
}

main();
