"use client";

import { useState, useRef, useEffect } from "react";
import { operationSnapshot } from "@/lib/selectors";
import { PLATFORM_MAP } from "@/lib/model";

const SUGGESTIONS = [
  "What most needs my attention today?",
  "Which clients have work stuck in approval?",
  "Draft 3 caption options for my next Instagram reel.",
  "Where do I have publishing gaps this week?",
];

export default function AssistantPanel({ ws, onClose }) {
  const [msgs, setMsgs] = useState([
    { role: "assistant", content: "I can see your whole workspace. Ask me what needs attention, or get me to draft copy, briefs, or a posting plan." },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, busy]);

  const send = async (text) => {
    const q = (text ?? input).trim();
    if (!q || busy) return;
    setInput("");
    const next = [...msgs, { role: "user", content: q }];
    setMsgs(next);
    setBusy(true);

    // Build snapshot with hydrated platform labels for readability.
    const hydratedWs = {
      ...ws,
      content: ws.content.map((c) => ({ ...c, platformLabel: PLATFORM_MAP[c.platform]?.label || c.platform })),
    };
    const snapshot = operationSnapshot(hydratedWs);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: q,
          snapshot,
          history: msgs.filter((m) => m.role !== "system"),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMsgs((m) => [...m, { role: "assistant", content: "⚠ " + (data.error || "Something went wrong.") }]);
      } else {
        setMsgs((m) => [...m, { role: "assistant", content: data.text }]);
      }
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "⚠ Couldn't reach the assistant. Are you online?" }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 100vw)",
      background: "#fff", borderLeft: "1px solid var(--line)", boxShadow: "-8px 0 24px rgba(0,0,0,0.08)",
      display: "flex", flexDirection: "column", zIndex: 150,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>✦</span>
          <span style={{ fontWeight: 600, fontSize: 15 }}>Assistant</span>
        </div>
        <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: "#888" }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === "user" ? "flex-end" : "flex-start", maxWidth: "88%" }}>
            <div style={{
              background: m.role === "user" ? "var(--accent)" : "#f4f2ec",
              color: m.role === "user" ? "#fff" : "var(--ink)",
              padding: "9px 12px", borderRadius: 12, fontSize: 14, lineHeight: 1.5, whiteSpace: "pre-wrap",
            }}>{m.content}</div>
          </div>
        ))}
        {busy && <div style={{ alignSelf: "flex-start", color: "var(--ink-mute)", fontSize: 13 }}>Thinking…</div>}
        <div ref={endRef} />
      </div>

      {msgs.length <= 1 && (
        <div style={{ padding: "0 16px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => send(s)} style={{
              textAlign: "left", border: "1px solid var(--line)", background: "#fcfbf8",
              borderRadius: 8, padding: "8px 11px", fontSize: 13, cursor: "pointer", color: "var(--ink-soft)",
            }}>{s}</button>
          ))}
        </div>
      )}

      <div style={{ padding: 12, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Ask about your operation…"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 9, border: "1px solid var(--line-strong)", fontSize: 14, fontFamily: "inherit" }}
        />
        <button onClick={() => send()} disabled={busy} style={{
          background: "var(--accent)", color: "#fff", border: "none", borderRadius: 9,
          padding: "0 16px", fontSize: 14, fontWeight: 500, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1,
        }}>Send</button>
      </div>
    </div>
  );
}
