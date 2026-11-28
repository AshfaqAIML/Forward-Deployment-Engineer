// src/ai/provider.js — the LLM provider adapter. Three implementations:
//   * sdk   — z-ai-web-dev-sdk, imported lazily (backend-only package)
//   * cli   — the `z-ai chat` CLI as a subprocess (works without the package)
//   * stub  — deterministic fake for the test suite (FDE_AI_PROVIDER=stub)
// Auto mode tries the SDK, then the CLI, then falls back to stub so the
// function never crashes on platforms where neither SDK nor CLI is available.
import { spawn } from "node:child_process";
import { writeFile, readFile, rm } from "node:fs/promises";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";

export async function resolveProvider(preference) {
  if (preference === "stub") return stubProvider;
  if (preference === "cli") return cliProvider;
  if (preference === "sdk") return sdkProvider;
  // auto: prefer SDK when resolvable, then CLI, then stub as final fallback
  try {
    await import("z-ai-web-dev-sdk");
    return sdkProvider;
  } catch {
    // SDK not available — try CLI
  }
  try {
    // Probe whether the z-ai CLI binary exists before committing to it.
    // On serverless platforms (Vercel) it typically won't, so we fall back
    // to stub rather than crashing the function.
    await new Promise((resolve, reject) => {
      const child = spawn("z-ai", ["--help"], { stdio: "ignore" });
      const timer = setTimeout(() => { child.kill("SIGKILL"); resolve(); }, 3000);
      child.on("error", (err) => { clearTimeout(timer); reject(err); });
      child.on("close", (code) => { clearTimeout(timer); resolve(code); });
    });
    return cliProvider;
  } catch {
    return stubProvider;
  }
}

export const sdkProvider = {
  name: "sdk",
  async complete(system, user) {
    const mod = await import("z-ai-web-dev-sdk");
    const ZAI = mod.default || mod;
    const zai = await ZAI.create();
    const completion = await zai.chat.completions.create({
      messages: [{ role: "assistant", content: system }, { role: "user", content: user }],
      thinking: { type: "disabled" },
    });
    const content = completion.choices?.[0]?.message?.content;
    if (!content || !content.trim()) throw new Error("empty completion");
    return content;
  },
};

export const cliProvider = {
  name: "cli",
  async complete(system, user) {
    const tmp = path.join(os.tmpdir(), `fde-ai-${crypto.randomUUID()}.json`);
    const prompt = user.slice(0, 24000);
    try {
      await new Promise((resolve, reject) => {
        let child;
        try {
          child = spawn("z-ai", ["chat", "-p", prompt, "-s", system.slice(0, 6000), "-o", tmp],
            { stdio: ["ignore", "ignore", "pipe"] });
        } catch (spawnErr) {
          reject(new Error(`z-ai CLI not available: ${spawnErr.code}`));
          return;
        }
        let err = "";
        child.stderr.on("data", d => { err += d; });
        const timer = setTimeout(() => child.kill("SIGKILL"), 120000);
        child.on("error", reject);
        child.on("close", code => { clearTimeout(timer); code === 0 ? resolve() : reject(new Error(`z-ai cli exited ${code}: ${err.slice(0, 200)}`)); });
      });
      const raw = JSON.parse(await readFile(tmp, "utf8"));
      const content = raw.choices?.[0]?.message?.content;
      if (!content || !content.trim()) throw new Error("empty completion");
      return content;
    } finally {
      await rm(tmp, { force: true }).catch(() => {});
    }
  },
};

export const stubProvider = {
  name: "stub",
  async complete(system, user) {
    // Deterministic, inspectable answer for tests: reflects the grounding rules.
    const grounded = system.includes("MATERIAL BEGINS") && !system.includes("MATERIAL IS EMPTY");
    const cite = (system.match(/\[lesson:([a-z0-9-]+)\]/) || [])[1];
    return [
      grounded ? "STUB TUTOR: grounded answer using the provided material." : "STUB TUTOR: this is not covered in the approved course material.",
      cite ? `Citing [lesson:${cite}].` : "No lesson citation available.",
      `Mode requested: ${/MODE: (\S+)/.exec(system)?.[1] || "explain"}.`,
    ].join(" ");
  },
};
