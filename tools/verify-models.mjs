#!/usr/bin/env node
// ============================================================
// Verifies every model in src/lib/ai/models.ts still answers on
// OpenRouter's free tier, and reports free models we are not using yet.
//
//   npm run verify:models
//
// OpenRouter retires free tiers without notice. When that happens the model
// answers 404 "This model is unavailable for free" and every generator that
// depends on it silently falls through its chain. Run this whenever the
// generators start failing.
// ============================================================

import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function loadEnv() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return {};
  const out = {};
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const m = line.match(/^([A-Z_0-9]+)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, "").trim();
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const KEY = env.OPENROUTER_API_KEY || env.ANTHROPIC_AUTH_TOKEN;
if (!KEY) {
  console.error("No API key. Set OPENROUTER_API_KEY or ANTHROPIC_AUTH_TOKEN.");
  process.exit(1);
}

const headers = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${KEY}`,
  "HTTP-Referer": env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "X-Title": "AIHub",
};

const source = fs.readFileSync(path.join(ROOT, "src/lib/ai/models.ts"), "utf8");
const chainBlock = source.match(/FALLBACK_CHAIN[^=]*=\s*\[([\s\S]*?)\]/);
if (!chainBlock) {
  console.error("Could not find FALLBACK_CHAIN in src/lib/ai/models.ts");
  process.exit(1);
}
const chain = [...chainBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
const blockedBlock = source.match(/BLOCKED_MODELS[^=]*=\s*\[([\s\S]*?)\]/);
const blocked = blockedBlock ? [...blockedBlock[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]) : [];

// A real structured generation — a model can be listed yet still refuse JSON.
const SYSTEM = 'Reply with ONLY this JSON and nothing else: {"ok":true,"n":42}';

// Reasoning models spend tokens before the answer starts. A tight cap reports
// a healthy model as "empty content", which is the exact failure this script
// exists to diagnose — so give it the same headroom the app uses.
const MAX_TOKENS = 3000;

// dead   = free tier retired, remove it from the chain
// busy   = provider rate limit or capacity, keep it (that is why it is last)
// broken = answers, but not with anything usable
const DEAD = "dead", BUSY = "busy", BROKEN = "broken", OK = "ok";

async function check(model) {
  const started = Date.now();
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: SYSTEM }, { role: "user", content: "go" }],
        max_tokens: MAX_TOKENS,
        temperature: 0.2,
        reasoning: { exclude: true },
      }),
    });
    const body = await res.json().catch(() => null);
    const secs = ((Date.now() - started) / 1000).toFixed(1);

    if (!res.ok || body?.error) {
      const why = body?.error?.message ?? `HTTP ${res.status}`;
      const status = res.status === 404 ? DEAD : res.status === 429 || res.status === 503 ? BUSY : BROKEN;
      return { model, status, secs, why: `${res.status} ${why}`.slice(0, 90) };
    }
    const content = body?.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) return { model, status: BROKEN, secs, why: "empty content" };
    if (!/\{[\s\S]*\}/.test(content)) return { model, status: BROKEN, secs, why: "no JSON in output" };
    return { model, status: OK, secs, why: "" };
  } catch (err) {
    return { model, status: BROKEN, secs: "-", why: err.message.slice(0, 90) };
  }
}

const LABEL = { ok: "PASS", busy: "BUSY", dead: "DEAD", broken: "BROKEN" };

/**
 * Free models are sampled, not deterministic — one run in three, a healthy
 * model will answer a terse probe conversationally instead of with JSON.
 * Retry once so a single unlucky sample does not get a working model deleted.
 */
async function checkWithRetry(model) {
  const first = await check(model);
  if (first.status !== BROKEN) return first;
  const second = await check(model);
  return second.status === OK ? { ...second, why: "passed on retry" } : second;
}

console.log(`Checking ${chain.length} models in FALLBACK_CHAIN…\n`);
const results = [];
for (const model of chain) {
  const r = await checkWithRetry(model);
  results.push(r);
  const line = `${LABEL[r.status].padEnd(6)} ${r.secs.padStart(5)}s  ${r.model}`;
  console.log(r.status === OK ? line : `${line}\n              ${r.why}`);
}

const dead = results.filter((r) => r.status === DEAD);
const broken = results.filter((r) => r.status === BROKEN);
const busy = results.filter((r) => r.status === BUSY);
const passed = results.filter((r) => r.status === OK);

// Surface free models that exist but are not in the chain and not deliberately
// blocked — those are candidates to add when the chain gets thin.
try {
  const all = await (await fetch("https://openrouter.ai/api/v1/models")).json();
  const free = all.data.filter((m) => m.id.endsWith(":free")).map((m) => m.id);
  const candidates = free.filter((id) => !chain.includes(id) && !blocked.includes(id));
  if (candidates.length) {
    console.log(`\nUnused free models worth evaluating (${candidates.length}):`);
    for (const id of candidates) console.log(`  ${id}`);
  }
  const goneFromCatalogue = chain.filter((id) => !free.includes(id));
  if (goneFromCatalogue.length) {
    console.log(`\nIn FALLBACK_CHAIN but no longer listed as free (${goneFromCatalogue.length}):`);
    for (const id of goneFromCatalogue) console.log(`  ${id}`);
  }
} catch {
  console.log("\nCould not fetch the full model catalogue.");
}

console.log(
  `\n${passed.length} usable, ${busy.length} rate-limited, ${dead.length} retired, ${broken.length} broken (of ${results.length}).`,
);

// Rate limits are transient and the chain is ordered so busy models sit last —
// they are not a reason to fail the check. Retired and broken models are.
if (dead.length || broken.length) {
  console.log("\nRemove these from FALLBACK_CHAIN in src/lib/ai/models.ts:");
  for (const r of [...dead, ...broken]) console.log(`  ${r.model} — ${r.why}`);
  process.exit(1);
}
if (passed.length < 3) {
  console.log("\nFewer than 3 usable models — generation will be unreliable.");
  process.exit(1);
}
console.log("Chain is healthy.");
