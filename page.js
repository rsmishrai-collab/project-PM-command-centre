"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { loadWorkspace, saveWorkspace, exportWorkspace, resetWorkspace } from "@/lib/store";
import { hydrate, buildNotifications } from "@/lib/selectors";
import { STAGE_MAP } from "@/lib/model";
import { DashboardView, PipelineView, CalendarView, ClientsView } from "@/components/views";
import ContentModal from "@/components/ContentModal";
import ClientModal from "@/components/ClientModal";
import AssistantPanel from "@/components/AssistantPanel";

export default function Home() {
  const [ws, setWs] = useState(null);
  const [view, setView] = useState("dashboard");
  const [clientFilter, setClientFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);      // content | "new" | null
  const [editingClient, setEditingClient] = useState(null);
  const [showAssistant, setShowAssistant] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => { setWs(loadWorkspace()); }, []);

  const commit = useCallback((next) => { setWs(next); saveWorkspace(next); }, []);

  // ── content mutations ──
  const upsertContent = (item) => {
    const exists = ws.content.some((c) => c.id === item.id);
    const content = exists ? ws.content.map((c) => c.id === item.id ? item : c) : [...ws.content, item];
    commit({ ...ws, content });
    setEditing(null);
  };
  const deleteContent = (id) => { commit({ ...ws, content: ws.content.filter((c) => c.id !== id) }); setEditing(null); };
  const advance = (id, stage) => {
    const patch = { stage };
    // Moving into client review flips approval to "sent" if still draft.
    commit({ ...ws, content: ws.content.map((c) => {
      if (c.id !== id) return c;
      const up = { ...c, stage };
      if (stage === "client" && (!c.approvalState || c.approvalState === "draft")) up.approvalState = "sent";
      return up;
    }) });
  };

  // ── client / brand / account mutations (all committed together) ──
  const saveClientBundle = ({ client, brands, accounts }) => {
    const clients = ws.clients.some((c) => c.id === client.id)
      ? ws.clients.map((c) => c.id === client.id ? client : c)
      : [...ws.clients, client];
    const otherBrands = ws.brands.filter((b) => b.clientId !== client.id);
    const otherAccounts = ws.accounts.filter((a) => a.clientId !== client.id);
    commit({ ...ws, clients, brands: [...otherBrands, ...brands], accounts: [...otherAccounts, ...accounts] });
    setEditingClient(null);
  };
  const deleteClient = (id) => {
    commit({
      ...ws,
      clients: ws.clients.filter((c) => c.id !== id),
      brands: ws.brands.filter((b) => b.clientId !== id),
      accounts: ws.accounts.filter((a) => a.clientId !== id),
      content: ws.content.filter((c) => c.clientId !== id),
    });
    setEditingClient(null);
  };

  // ── derived ──
  const hydrated = useMemo(() => (ws ? ws.content.map((c) => hydrate(c, ws)) : []), [ws]);

  const visible = useMemo(() => {
    let list = clientFilter === "all" ? hydrated : hydrated.filter((c) => c.clientId === clientFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        [c.title, c.clientName, c.brandName, c.accountHandle, c.platformLabel, c.type, c.owner, c.brief]
          .filter(Boolean).some((s) => s.toLowerCase().includes(q))
      );
    }
    return list;
  }, [hydrated, clientFilter, search]);

  const notifications = useMemo(() => (ws ? buildNotifications(ws) : []), [ws]);

  const doExport = () => {
    const blob = new Blob([exportWorkspace(ws)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "social-command-center-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };
  const doReset = () => { if (confirm("Reset to sample data? This wipes your current workspace.")) { const s = resetWorkspace(); setWs(s); } };

  if (!ws) return <div style={{ padding: 40, color: "var(--ink-soft)" }}>Loading…</div>;

  const openContentById = (id) => { const c = hydrated.find((x) => x.id === id); if (c) { setShowNotifs(false); setEditing(c); } };

  return (
    <div style={{ maxWidth: 1120, margin: "0 auto", minHeight: "100vh" }}>
      {/* header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 22px", borderBottom: "1px solid var(--line)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: "var(--accent)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>◐</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17 }}>Social Command Center</div>
            <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>What needs you today, across every client</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button onClick={() => setShowNotifs((s) => !s)} style={{ position: "relative", border: "1px solid var(--line-strong)", background: "#fff", borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontSize: 14 }}>
            ⚑
            {notifications.length > 0 && <span style={{ position: "absolute", top: -6, right: -6, background: "#a32d2d", color: "#fff", borderRadius: 10, fontSize: 10, padding: "1px 5px", fontWeight: 600 }}>{notifications.length}</span>}
          </button>
          <button onClick={() => setShowAssistant(true)} style={{ border: "none", background: "var(--accent)", color: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>✦ Assistant</button>
          <button onClick={() => setEditing("new")} style={{ border: "1px solid var(--line-strong)", background: "#fff", borderRadius: 8, padding: "8px 14px", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>+ Content</button>
        </div>
      </header>

      {/* controls */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px", gap: 12, flexWrap: "wrap" }}>
        <nav style={{ display: "flex", gap: 4, background: "#f1efe8", padding: 4, borderRadius: 10 }}>
          {[["dashboard", "Today"], ["pipeline", "Pipeline"], ["calendar", "Calendar"], ["clients", "Clients"]].map(([id, label]) => (
            <button key={id} onClick={() => setView(id)} style={{
              border: "none", background: view === id ? "#fff" : "transparent", boxShadow: view === id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              padding: "7px 16px", borderRadius: 7, fontSize: 14, cursor: "pointer", color: view === id ? "var(--ink)" : "var(--ink-soft)", fontWeight: 500,
            }}>{label}</button>
          ))}
        </nav>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search content…" style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line-strong)", fontSize: 14, width: 180 }} />
          {view !== "clients" && (
            <select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid var(--line-strong)", background: "#fff", fontSize: 14, cursor: "pointer" }}>
              <option value="all">All clients ({ws.clients.length})</option>
              {ws.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* main */}
      <main style={{ padding: "8px 22px 60px" }}>
        {view === "dashboard" && <DashboardView content={visible} ws={ws} onOpen={setEditing} onAdvance={advance} />}
        {view === "pipeline" && <PipelineView content={visible} onOpen={setEditing} onAdvance={advance} />}
        {view === "calendar" && <CalendarView content={visible} onOpen={setEditing} />}
        {view === "clients" && <ClientsView ws={ws} onEditClient={setEditingClient} onNewClient={() => setEditingClient("new")} onFilterTo={(id) => { setClientFilter(id); setView("pipeline"); }} onOpenContent={setEditing} />}
      </main>

      {/* footer utilities */}
      <footer style={{ padding: "0 22px 30px", display: "flex", gap: 12, fontSize: 12.5, color: "var(--ink-mute)" }}>
        <button onClick={doExport} style={linkBtn}>Export backup</button>
        <span>·</span>
        <button onClick={doReset} style={linkBtn}>Reset sample data</button>
        <span>·</span>
        <span>Data saved in this browser.</span>
      </footer>

      {/* notifications drawer */}
      {showNotifs && (
        <div style={{ position: "fixed", top: 66, right: 22, width: 340, maxHeight: "70vh", overflowY: "auto", background: "#fff", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "0 10px 30px rgba(0,0,0,0.12)", zIndex: 120, padding: 12 }}>
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, padding: "0 4px" }}>Alerts</div>
          {notifications.length === 0 && <div style={{ fontSize: 13, color: "#b4b2a9", padding: 8 }}>Nothing needs attention.</div>}
          {notifications.map((n) => (
            <button key={n.id} onClick={() => openContentById(n.contentId)} style={{ display: "block", width: "100%", textAlign: "left", border: "1px solid var(--line)", background: n.severity === "high" ? "#fcf3f3" : "#fcfbf8", borderRadius: 8, padding: "8px 10px", marginBottom: 6, cursor: "pointer", fontSize: 13, color: "var(--ink)" }}>
              {n.text}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <ContentModal item={editing === "new" ? null : editing} ws={ws} onSave={upsertContent} onDelete={deleteContent} onClose={() => setEditing(null)} />
      )}
      {editingClient && (
        <ClientModal client={editingClient === "new" ? null : editingClient} ws={ws} onSave={saveClientBundle} onDelete={deleteClient} onClose={() => setEditingClient(null)} />
      )}
      {showAssistant && <AssistantPanel ws={ws} onClose={() => setShowAssistant(false)} />}
    </div>
  );
}

const linkBtn = { border: "none", background: "transparent", color: "var(--accent)", cursor: "pointer", fontSize: 12.5, textDecoration: "underline", padding: 0 };
