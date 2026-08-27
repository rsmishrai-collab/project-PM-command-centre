// ─────────────────────────────────────────────────────────────
// Selectors — everything derived from the raw store.
// Dashboard buckets, notifications, and the AI assistant all read
// from here so they never disagree about what's overdue or stuck.
// ─────────────────────────────────────────────────────────────

import { daysUntil, isOverdue, OWN_COURT, PLATFORM_MAP } from "./model";

export function indexById(arr) {
  return Object.fromEntries(arr.map((x) => [x.id, x]));
}

// Attach parent names to a content item for display / search / AI context.
export function hydrate(item, ws) {
  const client = ws.clients.find((c) => c.id === item.clientId);
  const brand = ws.brands.find((b) => b.id === item.brandId);
  const account = ws.accounts.find((a) => a.id === item.accountId);
  return {
    ...item,
    clientName: client?.name || "—",
    clientColour: client?.colour || "#b4b2a9",
    brandName: brand?.name || "—",
    accountHandle: account?.handle || "—",
    platformLabel: PLATFORM_MAP[item.platform]?.label || item.platform,
    platformIcon: PLATFORM_MAP[item.platform]?.icon || "",
  };
}

export function dashboardBuckets(content) {
  const overdue = [], today = [], waiting = [], ready = [], soon = [];
  for (const c of content) {
    if (c.stage === "published") continue;
    const d = daysUntil(c.due);
    if (c.stage === "client") { waiting.push(c); continue; }
    if (c.stage === "approved" || c.stage === "scheduled") { ready.push(c); continue; }
    if (isOverdue(c)) overdue.push(c);
    else if (d === 0) today.push(c);
    else if (d !== null && d > 0 && d <= 3) soon.push(c);
  }
  return { overdue, today, waiting, ready, soon };
}

// Notifications are just problems surfaced from the data — no push, no cost.
export function buildNotifications(ws) {
  const out = [];
  for (const c of ws.content) {
    if (c.stage === "published") continue;
    if (isOverdue(c)) {
      out.push({ id: "od-" + c.id, kind: "overdue", severity: "high", contentId: c.id,
        text: `"${c.title}" is overdue (${-daysUntil(c.due)}d) — still in your court.` });
    }
    if (c.stage === "client") {
      out.push({ id: "cl-" + c.id, kind: "approval", severity: "med", contentId: c.id,
        text: `"${c.title}" is waiting on client approval.` });
    }
    if (c.approvalState === "changes") {
      out.push({ id: "rv-" + c.id, kind: "revision", severity: "med", contentId: c.id,
        text: `"${c.title}" has changes requested by the client.` });
    }
    // Publish date set but not yet approved and publish is within 2 days.
    const pd = daysUntil(c.publish);
    if (pd !== null && pd >= 0 && pd <= 2 && OWN_COURT.has(c.stage) && c.stage !== "approved") {
      out.push({ id: "pd-" + c.id, kind: "deadline", severity: "high", contentId: c.id,
        text: `"${c.title}" is due to publish in ${pd}d but isn't approved yet.` });
    }
    // Missing assets on something already in production or later.
    if (!OWN_COURT.has(c.stage) || c.stage === "production") {
      if ((c.assets || []).length === 0 && c.stage !== "idea" && c.stage !== "brief") {
        out.push({ id: "as-" + c.id, kind: "assets", severity: "low", contentId: c.id,
          text: `"${c.title}" has no assets attached.` });
      }
    }
  }
  const rank = { high: 0, med: 1, low: 2 };
  return out.sort((a, b) => rank[a.severity] - rank[b.severity]);
}

// Publishing gaps: days in the next 14 with nothing scheduled, per account.
export function publishingGaps(ws) {
  const scheduled = new Set(
    ws.content.filter((c) => c.publish).map((c) => c.publish)
  );
  const gaps = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0, 10);
    if (!scheduled.has(ds)) gaps.push(ds);
  }
  return gaps;
}

// Team workload: open (non-published) items per owner.
export function teamWorkload(ws) {
  const map = {};
  for (const c of ws.content) {
    if (c.stage === "published") continue;
    map[c.owner] = (map[c.owner] || 0) + 1;
  }
  return map;
}

// A compact, text snapshot of the whole operation for the AI assistant.
export function operationSnapshot(ws) {
  const lines = [];
  lines.push(`Clients: ${ws.clients.length}, Brands: ${ws.brands.length}, Accounts: ${ws.accounts.length}, Content items: ${ws.content.length}`);
  for (const cl of ws.clients) {
    const brands = ws.brands.filter((b) => b.clientId === cl.id);
    lines.push(`\nCLIENT: ${cl.name}${cl.note ? " (" + cl.note + ")" : ""}`);
    for (const b of brands) {
      const accs = ws.accounts.filter((a) => a.brandId === b.id);
      lines.push(`  BRAND: ${b.name} — accounts: ${accs.map((a) => a.platform + " " + a.handle).join(", ") || "none"}`);
    }
    const items = ws.content.filter((c) => c.clientId === cl.id && c.stage !== "published");
    for (const c of items) {
      const late = isOverdue(c) ? ` [OVERDUE ${-daysUntil(c.due)}d]` : "";
      lines.push(`    - "${c.title}" | ${c.platformLabel || c.platform} | stage:${c.stage} | owner:${c.owner} | due:${c.due || "—"} | publish:${c.publish || "—"}${late}`);
    }
  }
  return lines.join("\n");
}
