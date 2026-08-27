// ─────────────────────────────────────────────────────────────
// Domain model — the full hierarchy from the spec.
//
//   Organization (the manager — implicit, this whole workspace)
//     └─ Client
//          └─ Brand / Channel        (a client can have several)
//               └─ Social Account     (platform + handle, belongs to a brand)
//                    └─ Content Item   (attaches to ONE account)
//                         ├─ Tasks
//                         ├─ Assets (links)
//                         └─ Approval history
//
// Every entity carries the ids of its parents so any view can filter
// up or down the tree without walking relationships by hand.
// ─────────────────────────────────────────────────────────────

export const PLATFORMS = [
  { id: "youtube", label: "YouTube", icon: "▶", kinds: ["Video", "Short", "Live", "Community post"] },
  { id: "instagram", label: "Instagram", icon: "◉", kinds: ["Reel", "Post", "Carousel", "Story"] },
  { id: "facebook", label: "Facebook", icon: "f", kinds: ["Post", "Reel", "Story", "Video"] },
  { id: "linkedin", label: "LinkedIn", icon: "in", kinds: ["Post", "Article", "Document", "Video"] },
  { id: "twitter", label: "X", icon: "𝕏", kinds: ["Post", "Thread", "Reply"] },
  { id: "tiktok", label: "TikTok", icon: "♪", kinds: ["Video", "Photo", "Story"] },
];

export const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map((p) => [p.id, p]));

// Content workflow. Order is the pipeline, left to right.
export const STAGES = [
  { id: "idea", label: "Idea", tone: "slate", court: "you" },
  { id: "brief", label: "Brief", tone: "slate", court: "you" },
  { id: "production", label: "In production", tone: "blue", court: "you" },
  { id: "internal", label: "Internal review", tone: "violet", court: "you" },
  { id: "client", label: "Client review", tone: "amber", court: "client" },
  { id: "revision", label: "Revision", tone: "red", court: "you" },
  { id: "approved", label: "Approved", tone: "green", court: "you" },
  { id: "scheduled", label: "Scheduled", tone: "teal", court: "you" },
  { id: "published", label: "Published", tone: "gray", court: "done" },
];

export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.id, s]));
export const OWN_COURT = new Set(STAGES.filter((s) => s.court === "you").map((s) => s.id));

// Approval sub-states, tracked separately so approval history is auditable.
export const APPROVAL_STATES = [
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent for approval" },
  { id: "reviewing", label: "Client reviewing" },
  { id: "changes", label: "Changes requested" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
];
export const APPROVAL_MAP = Object.fromEntries(APPROVAL_STATES.map((a) => [a.id, a]));

export const TASK_STATES = [
  { id: "todo", label: "To do" },
  { id: "doing", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "done", label: "Done" },
];
export const TASK_MAP = Object.fromEntries(TASK_STATES.map((t) => [t.id, t]));

export const PRIORITIES = [
  { id: "high", label: "High" },
  { id: "med", label: "Medium" },
  { id: "low", label: "Low" },
];

export const ASSET_KINDS = ["Video", "Image", "Thumbnail", "Script", "Doc", "Brand guide", "Audio", "Reference"];

export const TONE = {
  slate: { bg: "#eef0f3", fg: "#3a4351", bd: "#c9cfd8" },
  blue: { bg: "#e6f1fb", fg: "#0c447c", bd: "#85b7eb" },
  violet: { bg: "#eeedfe", fg: "#3c3489", bd: "#afa9ec" },
  amber: { bg: "#faeeda", fg: "#854f0b", bd: "#ef9f27" },
  red: { bg: "#fcebeb", fg: "#a32d2d", bd: "#f09595" },
  green: { bg: "#eaf3de", fg: "#3b6d11", bd: "#97c459" },
  teal: { bg: "#e1f5ee", fg: "#0f6e56", bd: "#5dcaa5" },
  gray: { bg: "#f1efe8", fg: "#5f5e5a", bd: "#b4b2a9" },
};

export const CLIENT_COLOURS = [
  "#1d9e75", "#378add", "#d85a30", "#534ab7",
  "#d4537e", "#ba7517", "#0f6e56", "#185fa5",
];

// ── ids & dates ───────────────────────────────────────────────
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const nowIso = () => new Date().toISOString();

export function offset(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function fmtDate(d) {
  if (!d) return "";
  const dt = new Date(d + "T00:00:00");
  return dt.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function fmtDateTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function daysUntil(d) {
  if (!d) return null;
  const a = new Date(todayStr() + "T00:00:00");
  const b = new Date(d + "T00:00:00");
  return Math.round((b - a) / 86400000);
}

export function isOverdue(item) {
  if (!OWN_COURT.has(item.stage)) return false;
  const d = daysUntil(item.due);
  return d !== null && d < 0;
}
