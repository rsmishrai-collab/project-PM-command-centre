"use client";

import { TONE, STAGE_MAP } from "@/lib/model";

export function Modal({ children, onClose, wide }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(30,28,25,0.45)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "5vh 16px", zIndex: 200, overflowY: "auto",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 14, width: "100%",
          maxWidth: wide ? 720 : 540, boxShadow: "0 12px 40px rgba(0,0,0,0.2)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ModalHead({ title, onClose }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--line)" }}>
      <span style={{ fontSize: 16, fontWeight: 600 }}>{title}</span>
      <button onClick={onClose} style={{ border: "none", background: "transparent", fontSize: 16, cursor: "pointer", color: "#888" }}>✕</button>
    </div>
  );
}

export function Field({ label, children, hint }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minWidth: 0 }}>
      <span style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500 }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11.5, color: "var(--ink-mute)" }}>{hint}</span>}
    </label>
  );
}

export const inputStyle = {
  padding: "9px 11px", borderRadius: 8, border: "1px solid var(--line-strong)",
  fontSize: 14, fontFamily: "inherit", color: "var(--ink)", background: "#fff",
  width: "100%", boxSizing: "border-box",
};

export function Row({ children }) {
  return <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>{children}</div>;
}

export function PrimaryBtn({ children, onClick, type }) {
  return (
    <button type={type} onClick={onClick} style={{
      background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8,
      padding: "9px 16px", fontSize: 14, fontWeight: 500, cursor: "pointer",
    }}>{children}</button>
  );
}

export function GhostBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#fff", color: "var(--ink-soft)", border: "1px solid var(--line-strong)",
      borderRadius: 8, padding: "9px 16px", fontSize: 14, cursor: "pointer",
    }}>{children}</button>
  );
}

export function DangerBtn({ children, onClick }) {
  return (
    <button onClick={onClick} style={{
      background: "#fff", color: "#a32d2d", border: "1px solid rgba(240,153,149,0.6)",
      borderRadius: 8, padding: "9px 14px", fontSize: 13, cursor: "pointer",
    }}>{children}</button>
  );
}

export function StageChip({ stage }) {
  const s = STAGE_MAP[stage];
  if (!s) return null;
  const t = TONE[s.tone];
  return (
    <span style={{
      fontSize: 11.5, padding: "3px 9px", borderRadius: 20, border: `1px solid ${t.bd}`,
      background: t.bg, color: t.fg, fontWeight: 500, whiteSpace: "nowrap",
    }}>{s.label}</span>
  );
}

export function Stat({ label, value, tone }) {
  const t = TONE[tone] || TONE.gray;
  return (
    <div style={{ background: "#fff", border: "1px solid var(--line)", borderRadius: 12, padding: "16px 18px" }}>
      <div style={{ fontSize: 30, fontWeight: 600, lineHeight: 1, color: value === 0 ? "#b4b2a9" : t.fg }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 6 }}>{label}</div>
    </div>
  );
}

export function Empty({ children }) {
  return <div style={{ fontSize: 13, color: "#b4b2a9", padding: "10px 2px" }}>{children}</div>;
}
