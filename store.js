// ─────────────────────────────────────────────────────────────
// Store — the single source of truth for the whole workspace.
//
// Entities are kept as FLAT arrays keyed by id, not nested. Nesting
// reads nicely but is painful to update; flat + parent-ids is how a
// database would hold this, so swapping localStorage for Postgres
// later touches only the load/save functions at the bottom.
//
// Shape:
//   clients[]   { id, name, contact, colour, note }
//   brands[]    { id, clientId, name, note }
//   accounts[]  { id, clientId, brandId, platform, handle, note }
//   content[]   { id, clientId, brandId, accountId, platform, ... , approval[], tasks[], assets[] }
//   team[]      { id, name, role }
// ─────────────────────────────────────────────────────────────

import { uid, offset, nowIso } from "./model";

const KEY = "scc:workspace:v2";

// ── seed: one simple client, one complex client with several brands ──
function seed() {
  const c1 = uid(), c2 = uid();

  // Client 2 (ABC Media) has THREE brands, each with its own accounts —
  // this is the "10 accounts under one client" case made concrete.
  const b_tech = uid(), b_fin = uid(), b_gaming = uid();
  const b_aster = uid();

  const clients = [
    { id: c1, name: "Aster Skincare", contact: "priya@aster.co", colour: "#1d9e75", note: "Approvals over WhatsApp. Slow on weekends." },
    { id: c2, name: "ABC Media", contact: "ops@abcmedia.com", colour: "#378add", note: "Big account. Each brand has a different lead." },
  ];

  const brands = [
    { id: b_aster, clientId: c1, name: "Aster (main)", note: "" },
    { id: b_tech, clientId: c2, name: "ABC Tech", note: "Reviews, gadgets" },
    { id: b_fin, clientId: c2, name: "ABC Finance", note: "Strict legal review on claims" },
    { id: b_gaming, clientId: c2, name: "ABC Gaming", note: "Younger audience, meme tone ok" },
  ];

  const accounts = [
    { id: uid(), clientId: c1, brandId: b_aster, platform: "instagram", handle: "@aster.skin", note: "" },
    { id: uid(), clientId: c1, brandId: b_aster, platform: "youtube", handle: "Aster Skincare", note: "" },

    { id: uid(), clientId: c2, brandId: b_tech, platform: "youtube", handle: "ABC Tech", note: "Flagship channel" },
    { id: uid(), clientId: c2, brandId: b_tech, platform: "instagram", handle: "@abctech", note: "" },
    { id: uid(), clientId: c2, brandId: b_tech, platform: "twitter", handle: "@abctech", note: "" },

    { id: uid(), clientId: c2, brandId: b_fin, platform: "linkedin", handle: "ABC Finance", note: "Primary for finance" },
    { id: uid(), clientId: c2, brandId: b_fin, platform: "youtube", handle: "ABC Finance", note: "" },
    { id: uid(), clientId: c2, brandId: b_fin, platform: "instagram", handle: "@abc.finance", note: "" },

    { id: uid(), clientId: c2, brandId: b_gaming, platform: "youtube", handle: "ABC Gaming", note: "" },
    { id: uid(), clientId: c2, brandId: b_gaming, platform: "tiktok", handle: "@abcgaming", note: "High volume" },
    { id: uid(), clientId: c2, brandId: b_gaming, platform: "instagram", handle: "@abc.gaming", note: "" },
  ];

  const team = [
    { id: uid(), name: "Me", role: "Manager" },
    { id: uid(), name: "Riya", role: "Editor" },
    { id: uid(), name: "Sam", role: "Designer" },
  ];

  const acc = (i) => accounts[i];
  const mk = (o) => ({
    approval: [], tasks: [], assets: [], caption: "", hashtags: "", brief: "", cta: "", ...o,
  });

  const content = [
    mk({
      id: uid(), clientId: c1, brandId: b_aster, accountId: acc(0).id, platform: "instagram",
      title: "Vitamin C serum — launch reel", type: "Reel", stage: "client", approvalState: "reviewing",
      due: offset(1), publish: offset(4), owner: "Riya", priority: "high",
      brief: "Hero product launch. Client wants texture B-roll.",
      approval: [{ id: uid(), state: "sent", at: nowIso(), by: "Me", note: "Sent v1 for approval" }],
      tasks: [{ id: uid(), title: "Add captions", state: "done", assignee: "Riya" }, { id: uid(), title: "Colour grade", state: "doing", assignee: "Riya" }],
      assets: [{ id: uid(), kind: "Video", name: "Serum raw cut", url: "https://drive.google.com" }],
    }),
    mk({
      id: uid(), clientId: c2, brandId: b_fin, accountId: acc(5).id, platform: "linkedin",
      title: "SIP explainer — weekly", type: "Post", stage: "internal", approvalState: "draft",
      due: offset(-1), publish: offset(2), owner: "Me", priority: "high",
      brief: "Overdue. Waiting on my review. Legal must approve claims.",
    }),
    mk({
      id: uid(), clientId: c2, brandId: b_gaming, accountId: acc(9).id, platform: "tiktok",
      title: "Boss fight reaction", type: "Video", stage: "revision", approvalState: "changes",
      due: offset(0), publish: offset(1), owner: "Sam", priority: "med",
      brief: "Client asked to cut intro to 3s.",
      approval: [
        { id: uid(), state: "sent", at: nowIso(), by: "Me", note: "" },
        { id: uid(), state: "changes", at: nowIso(), by: "Client", note: "Trim the intro, too long" },
      ],
    }),
    mk({
      id: uid(), clientId: c2, brandId: b_tech, accountId: acc(2).id, platform: "youtube",
      title: "Phone camera comparison", type: "Video", stage: "production", approvalState: "draft",
      due: offset(3), publish: offset(7), owner: "Me", priority: "med", brief: "",
    }),
    mk({
      id: uid(), clientId: c1, brandId: b_aster, accountId: acc(1).id, platform: "youtube",
      title: "Skincare myths debunked", type: "Short", stage: "approved", approvalState: "approved",
      due: offset(2), publish: offset(3), owner: "Riya", priority: "low",
      approval: [{ id: uid(), state: "approved", at: nowIso(), by: "Client", note: "Good to go" }],
    }),
    mk({
      id: uid(), clientId: c2, brandId: b_tech, accountId: acc(4).id, platform: "twitter",
      title: "Launch day thread", type: "Thread", stage: "scheduled", approvalState: "approved",
      due: offset(-2), publish: offset(1), owner: "Me", priority: "med",
    }),
  ];

  return { clients, brands, accounts, content, team };
}

// ── persistence (browser). Swap these two for a DB later. ──
export function loadWorkspace() {
  if (typeof window === "undefined") return seed();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  const s = seed();
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  return s;
}

export function saveWorkspace(ws) {
  if (typeof window === "undefined") return;
  try { window.localStorage.setItem(KEY, JSON.stringify(ws)); } catch (e) {}
}

export function exportWorkspace(ws) {
  return JSON.stringify(ws, null, 2);
}

export function resetWorkspace() {
  if (typeof window !== "undefined") {
    try { window.localStorage.removeItem(KEY); } catch (e) {}
  }
  return seed();
}
