"use client";

import { useMemo, useState } from "react";
import {
  PLATFORM_MAP, STAGES, STAGE_MAP, TONE, daysUntil, fmtDate, todayStr, isOverdue,
} from "@/lib/model";
import { dashboardBuckets, hydrate, publishingGaps, teamWorkload } from "@/lib/selectors";
import { StageChip, Stat, Empty } from "./ui";

// ── shared content row ────────────────────────────────────────
function ContentRow({ c, onOpen, onAdvance }) {
  const d = daysUntil(c.due);
  const idx = STAGES.findIndex((s) => s.id === c.stage);
  const next = STAGES[Math.min(idx + 1, STAGES.length - 1)];
  return (
    <div className="row-hover" onClick={() => onOpen(c)} style={{
      display: "flex", alignItems: "stretch", background: "#fff", border: "1px solid var(--line)",
      borderRadius: 10, overflow: "hidden", cursor: "pointer",
    }}>
      <div style={{ width: 4, background: c.clientColour }} />
      <div style={{ flex: 1, padding: "11px 14px", minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 500, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.title}</span>
          {c.priority === "high" && <span style={{ fontSize: 10, background: "#fcebeb", color: "#a32d2d", padding: "1px 6px", borderRadius: 4, fontWeight: 600, textTransform: "uppercase" }}>High</span>}
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 3, display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontWeight: 500, color: c.clientColour }}>{c.clientName}</span>
          <span style={{ color: "#ccc" }}>›</span>
          <span>{c.brandName}</span>
          <span style={{ color: "#ccc" }}>·</span>
          <span>{c.platformIcon} {c.accountHandle}</span>
          <span style={{ color: "#ccc" }}>·</span>
          <span>{c.type}</span>
          <span style={{ color: "#ccc" }}>·</span>
          <span>{c.owner}</span>
        </div>
      </div>
      <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 14px" }}>
        <StageChip stage={c.stage} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, minWidth: 96 }}>
          {c.due && (
            <span style={{ fontSize: 12, fontWeight: d <= 0 ? 500 : 400, color: d < 0 ? "#a32d2d" : d === 0 ? "#854f0b" : "var(--ink-soft)" }}>
              {d < 0 ? `${-d}d late` : d === 0 ? "due today" : `in ${d}d`}
            </span>
          )}
          {c.stage !== "published" && (
            <button onClick={() => onAdvance(c.id, next.id)} style={{ fontSize: 11, border: "1px solid var(--line-strong)", background: "#fff", borderRadius: 6, padding: "3px 7px", cursor: "pointer", color: "var(--ink-soft)", whiteSpace: "nowrap" }}>→ {next.label}</button>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, hint, items, onOpen, onAdvance, empty }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>{title} {items.length > 0 && <span style={{ fontSize: 12, color: "#888", fontWeight: 400 }}>{items.length}</span>}</h3>
        {hint && <span style={{ fontSize: 12, color: "#a5a49d" }}>{hint}</span>}
      </div>
      {items.length === 0 ? <Empty>{empty}</Empty> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map((c) => <ContentRow key={c.id} c={c} onOpen={onOpen} onAdvance={onAdvance} />)}
        </div>
      )}
    </section>
  );
}

// ── DASHBOARD ─────────────────────────────────────────────────
export function DashboardView({ content, ws, onOpen, onAdvance }) {
  const b = useMemo(() => dashboardBuckets(content), [content]);
  const workload = useMemo(() => teamWorkload({ ...ws, content }), [ws, content]);
  const gaps = useMemo(() => publishingGaps({ ...ws, content }), [ws, content]);

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 24 }}>
        <Stat label="Overdue" value={b.overdue.length} tone="red" />
        <Stat label="Due today" value={b.today.length} tone="amber" />
        <Stat label="Waiting on client" value={b.waiting.length} tone="violet" />
        <Stat label="Ready to publish" value={b.ready.length} tone="green" />
      </div>

      <Section title="Overdue" hint="Past deadline and still in your court" items={b.overdue} onOpen={onOpen} onAdvance={onAdvance} empty="Nothing overdue. Rare and good." />
      <Section title="Due today" items={b.today} onOpen={onOpen} onAdvance={onAdvance} empty="Nothing due today." />
      <Section title="Waiting on client" hint="Chase these, they block everything downstream" items={b.waiting} onOpen={onOpen} onAdvance={onAdvance} empty="No approvals pending." />
      <Section title="Ready to publish" items={b.ready} onOpen={onOpen} onAdvance={onAdvance} empty="Nothing queued to go out." />
      <Section title="Coming up (3 days)" items={b.soon} onOpen={onOpen} onAdvance={onAdvance} empty="Clear for the next few days." />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 8 }}>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Team workload</div>
          {Object.keys(workload).length === 0 ? <Empty>No open work.</Empty> :
            Object.entries(workload).map(([who, n]) => (
              <div key={who} style={{ display: "flex", justifyContent: "space-between", fontSize: 13.5, padding: "5px 0", borderBottom: "1px solid #f2f0ea" }}>
                <span>{who}</span><span style={{ fontWeight: 500 }}>{n} open</span>
              </div>
            ))}
        </div>
        <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Publishing gaps (next 14 days)</div>
          {gaps.length === 0 ? <Empty>Every day has something scheduled.</Empty> : (
            <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.7 }}>
              {gaps.map((g) => fmtDate(g)).join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PIPELINE ──────────────────────────────────────────────────
export function PipelineView({ content, onOpen, onAdvance }) {
  const byStage = useMemo(() => {
    const m = Object.fromEntries(STAGES.map((s) => [s.id, []]));
    for (const c of content) if (m[c.stage]) m[c.stage].push(c);
    return m;
  }, [content]);

  return (
    <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 20 }}>
      {STAGES.map((s) => {
        const t = TONE[s.tone];
        const items = byStage[s.id];
        return (
          <div key={s.id} style={{ minWidth: 200, width: 200, flexShrink: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 4px", borderBottom: `2px solid ${t.bd}`, marginBottom: 8 }}>
              <span style={{ color: t.fg, fontWeight: 500, fontSize: 13 }}>{s.label}</span>
              <span style={{ fontSize: 12, color: "#888", background: "#f1efe8", borderRadius: 10, padding: "1px 8px" }}>{items.length}</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {items.length === 0 && <div style={{ fontSize: 12, color: "#ccc", textAlign: "center", padding: "12px 0" }}>—</div>}
              {items.map((c) => {
                const d = daysUntil(c.due);
                return (
                  <div key={c.id} className="tile" onClick={() => onOpen(c)} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 9, padding: "10px 11px", cursor: "pointer", position: "relative", overflow: "hidden" }}>
                    <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: c.clientColour }} />
                    <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.35, marginLeft: 4 }}>{c.title}</div>
                    <div style={{ fontSize: 11.5, marginTop: 4, marginLeft: 4, color: c.clientColour, fontWeight: 500 }}>{c.clientName}</div>
                    <div style={{ fontSize: 11, marginLeft: 4, color: "var(--ink-mute)" }}>{c.platformIcon} {c.accountHandle}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginLeft: 4 }}>
                      <span style={{ fontSize: 11, color: "var(--ink-mute)" }}>{c.owner}</span>
                      {c.due && <span style={{ fontSize: 11, color: d < 0 ? "#a32d2d" : d === 0 ? "#854f0b" : "#888780" }}>{d < 0 ? `${-d}d late` : d === 0 ? "today" : fmtDate(c.due)}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── CALENDAR ──────────────────────────────────────────────────
export function CalendarView({ content, onOpen }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); return { y: d.getFullYear(), m: d.getMonth() }; });

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const start = new Date(first);
    start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => { const d = new Date(start); d.setDate(start.getDate() + i); return d; });
  }, [cursor]);

  const byDate = useMemo(() => {
    const m = {};
    for (const c of content) if (c.publish) (m[c.publish] ||= []).push(c);
    return m;
  }, [content]);

  const monthName = new Date(cursor.y, cursor.m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
  const shift = (n) => setCursor((c) => { let m = c.m + n, y = c.y; if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; } return { y, m }; });

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 16 }}>
        <button onClick={() => shift(-1)} style={navBtn}>‹</button>
        <span style={{ fontSize: 16, fontWeight: 600, minWidth: 160, textAlign: "center" }}>{monthName}</span>
        <button onClick={() => shift(1)} style={navBtn}>›</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, background: "var(--line)", border: "1px solid var(--line)", borderRadius: 10, overflow: "hidden" }}>
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} style={{ background: "#f7f5f0", padding: "8px 0", textAlign: "center", fontSize: 12, fontWeight: 500, color: "var(--ink-mute)" }}>{d}</div>
        ))}
        {grid.map((d, i) => {
          const ds = d.toISOString().slice(0, 10);
          const inMonth = d.getMonth() === cursor.m;
          const isToday = ds === todayStr();
          const items = byDate[ds] || [];
          return (
            <div key={i} style={{ minHeight: 92, padding: 5, display: "flex", flexDirection: "column", gap: 3, opacity: inMonth ? 1 : 0.4, background: isToday ? "#faeeda" : "#fff" }}>
              <div style={{ fontSize: 12, color: "var(--ink-soft)", fontWeight: isToday ? 700 : 400, marginBottom: 2 }}>{d.getDate()}</div>
              {items.slice(0, 4).map((c) => (
                <div key={c.id} onClick={() => onOpen(c)} title={`${c.title} · ${c.accountHandle}`} style={{ fontSize: 10.5, padding: "2px 5px", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: 500, background: c.clientColour + "22", color: c.clientColour }}>
                  {c.platformIcon} {c.title}
                </div>
              ))}
              {items.length > 4 && <div style={{ fontSize: 10, color: "#888" }}>+{items.length - 4}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
const navBtn = { width: 32, height: 32, borderRadius: 8, border: "1px solid var(--line-strong)", background: "#fff", fontSize: 18, cursor: "pointer", color: "var(--ink-soft)" };

// ── CLIENTS (with brand/account tree) ─────────────────────────
export function ClientsView({ ws, onEditClient, onNewClient, onFilterTo, onOpenContent }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={onNewClient} style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer" }}>+ New client</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
        {ws.clients.map((cl) => {
          const brands = ws.brands.filter((b) => b.clientId === cl.id);
          const accts = ws.accounts.filter((a) => a.clientId === cl.id);
          const open = ws.content.filter((c) => c.clientId === cl.id && c.stage !== "published");
          const waiting = open.filter((c) => c.stage === "client").length;
          const overdue = open.filter((c) => isOverdue(c)).length;
          return (
            <div key={cl.id} style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: cl.colour }} />
                <div style={{ fontWeight: 600, fontSize: 15, flex: 1 }}>{cl.name}</div>
                <button onClick={() => onEditClient(cl)} style={{ border: "none", background: "transparent", color: "var(--ink-mute)", fontSize: 12.5, cursor: "pointer", textDecoration: "underline" }}>Manage</button>
              </div>
              {cl.note && <div style={{ fontSize: 12.5, color: "var(--ink-mute)", fontStyle: "italic", marginBottom: 10, lineHeight: 1.4 }}>{cl.note}</div>}

              <div style={{ display: "flex", gap: 12, fontSize: 12.5, color: "var(--ink-soft)", marginBottom: 12, flexWrap: "wrap" }}>
                <span><b>{brands.length}</b> brand{brands.length === 1 ? "" : "s"}</span>
                <span><b>{accts.length}</b> account{accts.length === 1 ? "" : "s"}</span>
                <span><b>{open.length}</b> active</span>
                {waiting > 0 && <span style={{ color: "#3c3489" }}><b>{waiting}</b> with client</span>}
                {overdue > 0 && <span style={{ color: "#a32d2d" }}><b>{overdue}</b> overdue</span>}
              </div>

              <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10, marginBottom: 10 }}>
                {brands.map((b) => {
                  const bAccts = accts.filter((a) => a.brandId === b.id);
                  return (
                    <div key={b.id} style={{ marginBottom: 8 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{b.name}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
                        {bAccts.length === 0 && <span style={{ fontSize: 11.5, color: "#bbb" }}>no accounts</span>}
                        {bAccts.map((a) => (
                          <span key={a.id} title={a.handle} style={{ fontSize: 11, background: "#f4f2ec", borderRadius: 5, padding: "2px 7px", color: "var(--ink-soft)" }}>
                            {PLATFORM_MAP[a.platform]?.icon} {a.handle}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => onFilterTo(cl.id)} style={{ width: "100%", border: "1px solid var(--line)", background: "var(--bg)", borderRadius: 8, padding: "7px 0", fontSize: 13, cursor: "pointer", color: "var(--accent)", fontWeight: 500 }}>Open pipeline →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
