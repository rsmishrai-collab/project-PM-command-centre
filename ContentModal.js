"use client";

import { useState, useMemo } from "react";
import {
  PLATFORM_MAP, STAGES, APPROVAL_STATES, TASK_STATES, PRIORITIES, ASSET_KINDS,
  uid, todayStr, nowIso, fmtDateTime,
} from "@/lib/model";
import { Modal, ModalHead, Field, Row, inputStyle, PrimaryBtn, GhostBtn, DangerBtn } from "./ui";

export default function ContentModal({ item, ws, onSave, onDelete, onClose }) {
  const blank = {
    id: uid(), clientId: ws.clients[0]?.id || "", brandId: "", accountId: "",
    platform: "instagram", title: "", type: "Post", stage: "idea",
    approvalState: "draft", due: todayStr(), publish: "", owner: ws.team[0]?.name || "Me",
    priority: "med", brief: "", caption: "", hashtags: "", cta: "",
    approval: [], tasks: [], assets: [],
  };
  const [f, setF] = useState(item ? { ...blank, ...item } : blank);
  const [err, setErr] = useState("");
  const [tab, setTab] = useState("details");

  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  // Cascading selects: brands under the chosen client, accounts under the chosen brand.
  const brands = useMemo(() => ws.brands.filter((b) => b.clientId === f.clientId), [ws.brands, f.clientId]);
  const accounts = useMemo(
    () => ws.accounts.filter((a) => a.clientId === f.clientId && (!f.brandId || a.brandId === f.brandId)),
    [ws.accounts, f.clientId, f.brandId]
  );

  const onClient = (id) => setF((s) => ({ ...s, clientId: id, brandId: "", accountId: "" }));
  const onBrand = (id) => setF((s) => ({ ...s, brandId: id, accountId: "" }));
  const onAccount = (id) => {
    const acc = ws.accounts.find((a) => a.id === id);
    setF((s) => ({ ...s, accountId: id, platform: acc ? acc.platform : s.platform, brandId: acc ? acc.brandId : s.brandId }));
  };

  const platformKinds = PLATFORM_MAP[f.platform]?.kinds || ["Post"];

  const save = () => {
    if (!f.title.trim()) { setErr("Give it a title."); setTab("details"); return; }
    if (!f.clientId) { setErr("Pick a client."); setTab("details"); return; }
    if (!f.accountId) { setErr("Pick which account this posts to."); setTab("details"); return; }
    onSave(f);
  };

  // ── approval actions ──
  const logApproval = (state, note) => {
    const entry = { id: uid(), state, at: nowIso(), by: state === "changes" || state === "approved" || state === "rejected" ? "Client" : "Me", note: note || "" };
    setF((s) => ({ ...s, approvalState: state, approval: [...(s.approval || []), entry] }));
  };

  // ── task actions ──
  const addTask = () => setF((s) => ({ ...s, tasks: [...s.tasks, { id: uid(), title: "New task", state: "todo", assignee: s.owner }] }));
  const updTask = (id, patch) => setF((s) => ({ ...s, tasks: s.tasks.map((t) => t.id === id ? { ...t, ...patch } : t) }));
  const delTask = (id) => setF((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));

  // ── asset actions ──
  const addAsset = () => setF((s) => ({ ...s, assets: [...s.assets, { id: uid(), kind: "Image", name: "", url: "" }] }));
  const updAsset = (id, patch) => setF((s) => ({ ...s, assets: s.assets.map((a) => a.id === id ? { ...a, ...patch } : a) }));
  const delAsset = (id) => setF((s) => ({ ...s, assets: s.assets.filter((a) => a.id !== id) }));

  const TabBtn = ({ id, label, count }) => (
    <button onClick={() => setTab(id)} style={{
      border: "none", background: tab === id ? "#fff" : "transparent",
      boxShadow: tab === id ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
      padding: "6px 12px", borderRadius: 7, fontSize: 13, cursor: "pointer",
      color: tab === id ? "var(--ink)" : "var(--ink-soft)", fontWeight: 500,
    }}>{label}{count > 0 && <span style={{ color: "#aaa", marginLeft: 5 }}>{count}</span>}</button>
  );

  return (
    <Modal onClose={onClose} wide>
      <ModalHead title={item ? "Edit content" : "New content"} onClose={onClose} />

      <div style={{ display: "flex", gap: 4, padding: "10px 20px 0", background: "#f7f5f0" }}>
        <TabBtn id="details" label="Details" />
        <TabBtn id="copy" label="Copy & brief" />
        <TabBtn id="tasks" label="Tasks" count={f.tasks.length} />
        <TabBtn id="assets" label="Assets" count={f.assets.length} />
        <TabBtn id="approval" label="Approval" count={f.approval.length} />
      </div>

      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14, maxHeight: "60vh", overflowY: "auto" }}>
        {tab === "details" && (
          <>
            <Field label="Title">
              <input style={inputStyle} value={f.title} onChange={(e) => { set("title", e.target.value); setErr(""); }} placeholder="Vitamin C serum — launch reel" autoFocus />
            </Field>
            <Row>
              <Field label="Client">
                <select style={inputStyle} value={f.clientId} onChange={(e) => onClient(e.target.value)}>
                  {ws.clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Brand / channel">
                <select style={inputStyle} value={f.brandId} onChange={(e) => onBrand(e.target.value)}>
                  <option value="">— any —</option>
                  {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </Field>
            </Row>
            <Field label="Account (which handle this posts to)" hint={accounts.length === 0 ? "No accounts under this client yet — add them in the Clients tab." : ""}>
              <select style={inputStyle} value={f.accountId} onChange={(e) => onAccount(e.target.value)}>
                <option value="">— pick an account —</option>
                {accounts.map((a) => <option key={a.id} value={a.id}>{PLATFORM_MAP[a.platform]?.icon} {a.handle} ({PLATFORM_MAP[a.platform]?.label})</option>)}
              </select>
            </Field>
            <Row>
              <Field label="Content type">
                <select style={inputStyle} value={f.type} onChange={(e) => set("type", e.target.value)}>
                  {platformKinds.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
              </Field>
              <Field label="Owner">
                <select style={inputStyle} value={f.owner} onChange={(e) => set("owner", e.target.value)}>
                  {ws.team.map((t) => <option key={t.id} value={t.name}>{t.name}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Stage">
                <select style={inputStyle} value={f.stage} onChange={(e) => set("stage", e.target.value)}>
                  {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </Field>
              <Field label="Priority">
                <select style={inputStyle} value={f.priority} onChange={(e) => set("priority", e.target.value)}>
                  {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </Field>
            </Row>
            <Row>
              <Field label="Due (your deadline)">
                <input type="date" style={inputStyle} value={f.due || ""} onChange={(e) => set("due", e.target.value)} />
              </Field>
              <Field label="Publish date">
                <input type="date" style={inputStyle} value={f.publish || ""} onChange={(e) => set("publish", e.target.value)} />
              </Field>
            </Row>
          </>
        )}

        {tab === "copy" && (
          <>
            <Field label="Brief / objective">
              <textarea style={{ ...inputStyle, height: 70, resize: "vertical", paddingTop: 8 }} value={f.brief} onChange={(e) => set("brief", e.target.value)} placeholder="What this piece is for, the angle, client notes…" />
            </Field>
            <Field label="Caption">
              <textarea style={{ ...inputStyle, height: 90, resize: "vertical", paddingTop: 8 }} value={f.caption} onChange={(e) => set("caption", e.target.value)} placeholder="The post copy…" />
            </Field>
            <Row>
              <Field label="Hashtags">
                <input style={inputStyle} value={f.hashtags} onChange={(e) => set("hashtags", e.target.value)} placeholder="#skincare #vitaminc" />
              </Field>
              <Field label="Call to action">
                <input style={inputStyle} value={f.cta} onChange={(e) => set("cta", e.target.value)} placeholder="Link in bio" />
              </Field>
            </Row>
          </>
        )}

        {tab === "tasks" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {f.tasks.length === 0 && <div style={{ fontSize: 13, color: "#b4b2a9" }}>No tasks yet.</div>}
            {f.tasks.map((t) => (
              <div key={t.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input style={{ ...inputStyle, flex: 2 }} value={t.title} onChange={(e) => updTask(t.id, { title: e.target.value })} />
                <select style={{ ...inputStyle, width: 120 }} value={t.state} onChange={(e) => updTask(t.id, { state: e.target.value })}>
                  {TASK_STATES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <select style={{ ...inputStyle, width: 100 }} value={t.assignee} onChange={(e) => updTask(t.id, { assignee: e.target.value })}>
                  {ws.team.map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
                <button onClick={() => delTask(t.id)} style={{ border: "none", background: "transparent", color: "#a32d2d", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            ))}
            <div><GhostBtn onClick={addTask}>+ Add task</GhostBtn></div>
          </div>
        )}

        {tab === "assets" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {f.assets.length === 0 && <div style={{ fontSize: 13, color: "#b4b2a9" }}>No assets linked. Paste Drive / Dropbox / Frame.io links here.</div>}
            {f.assets.map((a) => (
              <div key={a.id} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <select style={{ ...inputStyle, width: 120 }} value={a.kind} onChange={(e) => updAsset(a.id, { kind: e.target.value })}>
                  {ASSET_KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <input style={{ ...inputStyle, flex: 1 }} placeholder="Label" value={a.name} onChange={(e) => updAsset(a.id, { name: e.target.value })} />
                <input style={{ ...inputStyle, flex: 2 }} placeholder="https://…" value={a.url} onChange={(e) => updAsset(a.id, { url: e.target.value })} />
                <button onClick={() => delAsset(a.id)} style={{ border: "none", background: "transparent", color: "#a32d2d", cursor: "pointer", fontSize: 16 }}>✕</button>
              </div>
            ))}
            <div><GhostBtn onClick={addAsset}>+ Add asset link</GhostBtn></div>
          </div>
        )}

        {tab === "approval" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, color: "var(--ink-soft)" }}>
              Current status: <b>{APPROVAL_STATES.find((a) => a.id === f.approvalState)?.label || "Draft"}</b>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <GhostBtn onClick={() => logApproval("sent")}>Send for approval</GhostBtn>
              <GhostBtn onClick={() => logApproval("reviewing")}>Mark client reviewing</GhostBtn>
              <GhostBtn onClick={() => logApproval("changes", "Changes requested")}>Changes requested</GhostBtn>
              <GhostBtn onClick={() => logApproval("approved", "Approved")}>Approved</GhostBtn>
              <GhostBtn onClick={() => logApproval("rejected", "Rejected")}>Rejected</GhostBtn>
            </div>
            <div style={{ borderTop: "1px solid var(--line)", paddingTop: 10 }}>
              <div style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500, marginBottom: 8 }}>History</div>
              {f.approval.length === 0 && <div style={{ fontSize: 13, color: "#b4b2a9" }}>No approval events yet.</div>}
              {[...f.approval].reverse().map((e) => (
                <div key={e.id} style={{ fontSize: 13, padding: "6px 0", borderBottom: "1px solid #f2f0ea" }}>
                  <b>{APPROVAL_STATES.find((a) => a.id === e.state)?.label || e.state}</b>
                  <span style={{ color: "#aaa" }}> · {e.by} · {fmtDateTime(e.at)}</span>
                  {e.note && <div style={{ color: "var(--ink-soft)" }}>{e.note}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {err && <div style={{ fontSize: 13, color: "#a32d2d" }}>{err}</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
        {item ? <DangerBtn onClick={() => onDelete(f.id)}>Delete</DangerBtn> : <span />}
        <div style={{ display: "flex", gap: 8 }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={save}>Save</PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
