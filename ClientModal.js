"use client";

import { useState } from "react";
import { PLATFORMS, PLATFORM_MAP, CLIENT_COLOURS, uid } from "@/lib/model";
import { Modal, ModalHead, Field, inputStyle, PrimaryBtn, GhostBtn, DangerBtn } from "./ui";

// Manages a client together with its brands and accounts in one place.
// onSave receives { client, brands, accounts } so the parent can commit all three.
export default function ClientModal({ client, ws, onSave, onDelete, onClose }) {
  const isNew = !client;
  const [c, setC] = useState(
    client || { id: uid(), name: "", contact: "", colour: CLIENT_COLOURS[0], note: "" }
  );
  const [brands, setBrands] = useState(
    client ? ws.brands.filter((b) => b.clientId === client.id) : [{ id: uid(), clientId: c.id, name: "Main", note: "" }]
  );
  const [accounts, setAccounts] = useState(
    client ? ws.accounts.filter((a) => a.clientId === client.id) : []
  );
  const [err, setErr] = useState("");

  const setC_ = (k, v) => setC((s) => ({ ...s, [k]: v }));

  const addBrand = () => setBrands((b) => [...b, { id: uid(), clientId: c.id, name: "", note: "" }]);
  const updBrand = (id, patch) => setBrands((b) => b.map((x) => x.id === id ? { ...x, ...patch } : x));
  const delBrand = (id) => {
    setBrands((b) => b.filter((x) => x.id !== id));
    setAccounts((a) => a.filter((x) => x.brandId !== id)); // cascade
  };

  const addAccount = (brandId) => setAccounts((a) => [...a, { id: uid(), clientId: c.id, brandId, platform: "instagram", handle: "", note: "" }]);
  const updAccount = (id, patch) => setAccounts((a) => a.map((x) => x.id === id ? { ...x, ...patch } : x));
  const delAccount = (id) => setAccounts((a) => a.filter((x) => x.id !== id));

  const save = () => {
    if (!c.name.trim()) { setErr("Client needs a name."); return; }
    if (brands.some((b) => !b.name.trim())) { setErr("Every brand needs a name."); return; }
    if (accounts.some((a) => !a.handle.trim())) { setErr("Every account needs a handle."); return; }
    onSave({
      client: c,
      brands: brands.map((b) => ({ ...b, clientId: c.id })),
      accounts: accounts.map((a) => ({ ...a, clientId: c.id })),
    });
  };

  const totalAccounts = accounts.length;

  return (
    <Modal onClose={onClose} wide>
      <ModalHead title={isNew ? "New client" : "Edit client"} onClose={onClose} />
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16, maxHeight: "64vh", overflowY: "auto" }}>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Field label="Client name">
            <input style={inputStyle} value={c.name} onChange={(e) => { setC_("name", e.target.value); setErr(""); }} placeholder="ABC Media" autoFocus />
          </Field>
          <Field label="Main contact">
            <input style={inputStyle} value={c.contact} onChange={(e) => setC_("contact", e.target.value)} placeholder="ops@abcmedia.com" />
          </Field>
        </div>

        <Field label="Colour">
          <div style={{ display: "flex", gap: 8 }}>
            {CLIENT_COLOURS.map((col) => (
              <button key={col} onClick={() => setC_("colour", col)} style={{
                width: 26, height: 26, borderRadius: "50%", background: col,
                border: c.colour === col ? "3px solid #2c2c2a" : "1px solid #ddd", cursor: "pointer",
              }} />
            ))}
          </div>
        </Field>

        <Field label="Notes (approval quirks, guidelines…)">
          <textarea style={{ ...inputStyle, height: 56, resize: "vertical", paddingTop: 8 }} value={c.note} onChange={(e) => setC_("note", e.target.value)} placeholder="Approvals via WhatsApp. Legal reviews finance claims." />
        </Field>

        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Brands & channels <span style={{ color: "#aaa", fontWeight: 400 }}>· {totalAccounts} account{totalAccounts === 1 ? "" : "s"} total</span></div>
            <GhostBtn onClick={addBrand}>+ Add brand</GhostBtn>
          </div>

          {brands.map((b) => {
            const accs = accounts.filter((a) => a.brandId === b.id);
            return (
              <div key={b.id} style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, marginBottom: 10, background: "#fcfbf8" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input style={{ ...inputStyle, flex: 1, fontWeight: 500 }} value={b.name} onChange={(e) => updBrand(b.id, { name: e.target.value })} placeholder="Brand / channel name" />
                  <input style={{ ...inputStyle, flex: 1 }} value={b.note} onChange={(e) => updBrand(b.id, { note: e.target.value })} placeholder="Note (optional)" />
                  <button onClick={() => delBrand(b.id)} title="Remove brand" style={{ border: "none", background: "transparent", color: "#a32d2d", cursor: "pointer", fontSize: 15 }}>✕</button>
                </div>

                <div style={{ paddingLeft: 8, borderLeft: "2px solid var(--line)", marginLeft: 2 }}>
                  {accs.length === 0 && <div style={{ fontSize: 12.5, color: "#b4b2a9", padding: "4px 0 8px" }}>No accounts under this brand.</div>}
                  {accs.map((a) => (
                    <div key={a.id} style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 6 }}>
                      <select style={{ ...inputStyle, width: 130 }} value={a.platform} onChange={(e) => updAccount(a.id, { platform: e.target.value })}>
                        {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.icon} {p.label}</option>)}
                      </select>
                      <input style={{ ...inputStyle, flex: 1 }} value={a.handle} onChange={(e) => updAccount(a.id, { handle: e.target.value })} placeholder="@handle or channel name" />
                      <input style={{ ...inputStyle, flex: 1 }} value={a.note} onChange={(e) => updAccount(a.id, { note: e.target.value })} placeholder="Note" />
                      <button onClick={() => delAccount(a.id)} title="Remove account" style={{ border: "none", background: "transparent", color: "#a32d2d", cursor: "pointer", fontSize: 15 }}>✕</button>
                    </div>
                  ))}
                  <button onClick={() => addAccount(b.id)} style={{ border: "1px dashed var(--line-strong)", background: "#fff", borderRadius: 7, padding: "5px 10px", fontSize: 12.5, cursor: "pointer", color: "var(--ink-soft)", marginTop: 2 }}>+ Add account to {b.name || "this brand"}</button>
                </div>
              </div>
            );
          })}
        </div>

        {err && <div style={{ fontSize: 13, color: "#a32d2d" }}>{err}</div>}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid var(--line)" }}>
        {!isNew ? <DangerBtn onClick={() => onDelete(c.id)}>Delete client</DangerBtn> : <span />}
        <div style={{ display: "flex", gap: 8 }}>
          <GhostBtn onClick={onClose}>Cancel</GhostBtn>
          <PrimaryBtn onClick={save}>Save client</PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
