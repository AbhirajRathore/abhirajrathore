"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import type { ApplicationRecord, ApplicationStatus } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/config";
import { formatDate, scoreColor, scoreLabel } from "@/lib/utils";
import { isNotionSyncEligible } from "@/lib/notionSyncPayload";
import styles from "./jobs.module.css";

interface Props {
  applications: ApplicationRecord[];
  notionSelectedIds: string[];
  onNotionToggleRow: (id: string) => void;
  onNotionBulkSelectFiltered: (eligibleIdsInView: string[]) => void;
}

type SortField = "company" | "score" | "created_at" | "applied_at" | "status";
type SortDir = "asc" | "desc";

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "all", label: "All Statuses" },
  { value: "draft", label: "Draft" },
  { value: "ready", label: "Ready" },
  { value: "applied", label: "Applied" },
  { value: "interview", label: "Interview" },
  { value: "rejected", label: "Rejected" },
];

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const classMap: Record<ApplicationStatus, string> = {
    draft: styles.badgeDraft,
    ready: styles.badgeReady,
    applied: styles.badgeApplied,
    interview: styles.badgeInterview,
    rejected: styles.badgeRejected,
  };
  return (
    <span className={`${styles.badge} ${classMap[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function ScoreCell({ app }: { app: ApplicationRecord }) {
  if (!app.score) {
    return <span style={{ color: "var(--secondary)", fontSize: "0.8rem" }}>—</span>;
  }
  const total = app.score.total;
  const color = scoreColor(total);
  return (
    <div style={{ minWidth: 80 }}>
      <span style={{ fontWeight: 700, color, fontSize: "0.95rem" }}>{total}</span>
      <span style={{ color: "var(--secondary)", fontSize: "0.75rem", marginLeft: 4 }}>
        {scoreLabel(total)}
      </span>
      <div className={styles.scoreBar} style={{ marginTop: 4 }}>
        <div
          className={styles.scoreBarFill}
          style={{ width: `${total}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function ApplicationTable({
  applications,
  notionSelectedIds,
  onNotionToggleRow,
  onNotionBulkSelectFiltered,
}: Props) {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const headerNotionCheckboxRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    let list = [...applications];

    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.company.toLowerCase().includes(q) ||
          a.role.toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";

      if (sortField === "company") { av = a.company; bv = b.company; }
      else if (sortField === "score") { av = a.score?.total ?? -1; bv = b.score?.total ?? -1; }
      else if (sortField === "created_at") { av = a.created_at; bv = b.created_at; }
      else if (sortField === "applied_at") { av = a.applied_at ?? ""; bv = b.applied_at ?? ""; }
      else if (sortField === "status") { av = a.status; bv = b.status; }

      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [applications, statusFilter, search, sortField, sortDir]);

  const eligibleInView = useMemo(
    () => filtered.filter(isNotionSyncEligible),
    [filtered]
  );
  const eligibleIdsInView = useMemo(
    () => eligibleInView.map((a) => a.id),
    [eligibleInView]
  );

  const allEligibleInViewSelected =
    eligibleIdsInView.length > 0 &&
    eligibleIdsInView.every((id) => notionSelectedIds.includes(id));
  const someEligibleInViewSelected = eligibleIdsInView.some((id) =>
    notionSelectedIds.includes(id)
  );

  useEffect(() => {
    const el = headerNotionCheckboxRef.current;
    if (!el) return;
    el.indeterminate =
      someEligibleInViewSelected && !allEligibleInViewSelected;
  }, [someEligibleInViewSelected, allEligibleInViewSelected]);

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  function sortIndicator(field: SortField) {
    if (sortField !== field) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  const stats = useMemo(() => {
    const total = applications.length;
    const applied = applications.filter((a) => a.status === "applied").length;
    const interview = applications.filter((a) => a.status === "interview").length;
    const avgScore =
      applications.filter((a) => a.score).length > 0
        ? Math.round(
            applications
              .filter((a) => a.score)
              .reduce((sum, a) => sum + (a.score?.total ?? 0), 0) /
              applications.filter((a) => a.score).length
          )
        : null;
    return { total, applied, interview, avgScore };
  }, [applications]);

  return (
    <div>
      {/* Stats Row */}
      <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
        {[
          { label: "Total", value: stats.total, color: "var(--primary)" },
          { label: "Applied", value: stats.applied, color: "#10b981" },
          { label: "Interviews", value: stats.interview, color: "#8b5cf6" },
          {
            label: "Avg Score",
            value: stats.avgScore !== null ? `${stats.avgScore}` : "—",
            color: stats.avgScore !== null ? scoreColor(stats.avgScore) : "var(--secondary)",
          },
        ].map((stat) => (
          <div key={stat.label} className={styles.card} style={{ flex: "1 1 120px", textAlign: "center", padding: "0.85rem" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: stat.color, fontFamily: "var(--font-outfit)" }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--secondary)", marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className={styles.filterBar}>
        <input
          className={styles.searchInput}
          type="text"
          placeholder="Search company or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <span style={{ fontSize: "0.8rem", color: "var(--secondary)", marginLeft: "auto" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.tableCheckboxCell} title="Select applied roles to sync to Notion">
                <input
                  ref={headerNotionCheckboxRef}
                  type="checkbox"
                  className={styles.tableCheckbox}
                  checked={allEligibleInViewSelected}
                  disabled={eligibleIdsInView.length === 0}
                  onChange={() =>
                    onNotionBulkSelectFiltered(eligibleIdsInView)
                  }
                  aria-label="Select all applications in this view that can sync to Notion"
                />
              </th>
              <th onClick={() => toggleSort("company")}>
                Company / Role{sortIndicator("company")}
              </th>
              <th onClick={() => toggleSort("status")}>
                Status{sortIndicator("status")}
              </th>
              <th onClick={() => toggleSort("score")}>
                Score{sortIndicator("score")}
              </th>
              <th onClick={() => toggleSort("created_at")}>
                Created{sortIndicator("created_at")}
              </th>
              <th onClick={() => toggleSort("applied_at")}>
                Applied{sortIndicator("applied_at")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className={styles.tableEmpty}>
                  {applications.length === 0
                    ? "No applications yet. Create your first one!"
                    : "No results match your filters."}
                </td>
              </tr>
            ) : (
              filtered.map((app) => (
                <tr key={app.id}>
                  <td
                    className={styles.tableCheckboxCell}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {isNotionSyncEligible(app) ? (
                      <input
                        type="checkbox"
                        className={styles.tableCheckbox}
                        checked={notionSelectedIds.includes(app.id)}
                        onChange={() => onNotionToggleRow(app.id)}
                        title="Include in Notion sync"
                        aria-label={`Sync ${app.company} — ${app.role} to Notion`}
                      />
                    ) : app.notion_synced ? (
                      <span
                        title="Already synced to Notion"
                        style={{ fontSize: "0.75rem", color: "#10b981" }}
                      >
                        ✓
                      </span>
                    ) : (
                      <span
                        title="Mark as Applied to enable Notion sync"
                        style={{ fontSize: "0.75rem", color: "var(--secondary)" }}
                      >
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/jobs/${app.id}`}
                      style={{ textDecoration: "none", display: "block" }}
                    >
                      <div className={styles.tableCompany}>{app.company}</div>
                      <div className={styles.tableRole}>{app.role}</div>
                    </Link>
                  </td>
                  <td>
                    <StatusBadge status={app.status} />
                    {app.notion_synced && (
                      <span
                        title="Synced to Notion"
                        style={{ marginLeft: 6, fontSize: "0.7rem", color: "#10b981" }}
                      >
                        ✓ Notion
                      </span>
                    )}
                  </td>
                  <td>
                    <ScoreCell app={app} />
                  </td>
                  <td style={{ color: "var(--secondary)", fontSize: "0.82rem" }}>
                    {formatDate(app.created_at)}
                  </td>
                  <td style={{ color: "var(--secondary)", fontSize: "0.82rem" }}>
                    {app.applied_at ? formatDate(app.applied_at) : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
