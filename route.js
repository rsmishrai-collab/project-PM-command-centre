// ─────────────────────────────────────────────────────────────
// /api/assistant — the ONLY server code in the app.
//
// Why it exists: your Anthropic API key must never reach the browser.
// The client sends the user's question plus a text snapshot of their
// workspace; this route adds the key (from an env var) and calls Claude.
//
// Set ANTHROPIC_API_KEY in Vercel → Project → Settings → Environment
// Variables. Never commit it. Model defaults to Haiku (cheapest).
// ─────────────────────────────────────────────────────────────

import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const SYSTEM = `You are the operations assistant inside a social media manager's command centre tool.
You are given a live snapshot of their workspace: clients, brands, social accounts, and every content item with its stage, owner, and dates.

Your job is to be a sharp, practical chief-of-staff. When asked, you:
- tell them what most needs attention and why (overdue work, approvals stuck with clients, publishing gaps)
- draft captions, hooks, briefs, or hashtags when asked, matched to the client and platform
- suggest what to post where a schedule has gaps
- answer questions about their own operation using ONLY the snapshot provided

Rules:
- Be direct and specific. Name the actual content items, clients, and accounts from the snapshot.
- Never invent analytics, view counts, or engagement numbers — the tool does not have them. If asked, say so plainly.
- Use British English. Keep it tight. No hyphens as bullet joiners in prose.
- If the snapshot doesn't contain what's needed to answer, say what's missing rather than guessing.`;

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request body." }, { status: 400 });
  }

  const { message, snapshot, history } = body || {};
  if (!message || typeof message !== "string") {
    return Response.json({ error: "No message provided." }, { status: 400 });
  }

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return Response.json({
      error: "The assistant isn't configured yet. Add ANTHROPIC_API_KEY in your Vercel environment variables, then redeploy.",
    }, { status: 503 });
  }

  const anthropic = new Anthropic({ apiKey: key });

  const priorTurns = Array.isArray(history)
    ? history.slice(-8).map((h) => ({ role: h.role === "user" ? "user" : "assistant", content: String(h.content || "") }))
    : [];

  const userContent =
    `Here is the current snapshot of my workspace:\n\n<workspace>\n${snapshot || "(empty)"}\n</workspace>\n\n` +
    `My question: ${message}`;

  try {
    const resp = await anthropic.messages.create({
      model: process.env.ASSISTANT_MODEL || "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM,
      messages: [...priorTurns, { role: "user", content: userContent }],
    });
    const text = resp.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return Response.json({ text: text || "(no response)" });
  } catch (err) {
    const msg = err?.status === 401
      ? "Anthropic rejected the API key. Check ANTHROPIC_API_KEY in Vercel."
      : err?.status === 429
      ? "Rate limit or out of credit on the Anthropic account."
      : "The assistant hit an error reaching Claude. Try again in a moment.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
