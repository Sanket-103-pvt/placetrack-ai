// TableSkeleton.tsx — Skeleton for the Applications list view.
// Renders N skeleton application-detail cards matching the real Application component layout.

import { Skeleton } from "./Skeleton";

interface TableSkeletonProps {
  /** Number of skeleton rows to render (default 5). */
  rows?: number;
}

function SkeletonApplicationDetail() {
  return (
    <section
      className="card application-detail"
      style={{ padding: "22px 25px" }}
      aria-hidden="true"
    >
      {/* Head row: logo + company name + status badge + date */}
      <div
        className="application-detail-head"
        style={{ display: "grid", gridTemplateColumns: "auto 1fr auto auto", alignItems: "center", gap: "12px", marginBottom: "20px" }}
      >
        <Skeleton width="44px" height="44px" borderRadius="12px" style={{ flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
          <Skeleton width="45%" height="14px" />
          <Skeleton width="30%" height="11px" />
        </div>
        <Skeleton width="80px" height="24px" borderRadius="20px" />
        <div style={{ display: "flex", flexDirection: "column", gap: "5px", textAlign: "right" }}>
          <Skeleton width="50px" height="10px" />
          <Skeleton width="70px" height="12px" />
        </div>
      </div>

      {/* Timeline placeholder — 4 steps */}
      <div
        style={{ display: "flex", gap: "0", marginBottom: "16px" }}
        aria-hidden="true"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
            <Skeleton width="28px" height="28px" borderRadius="50%" />
            <Skeleton width="70%" height="9px" />
          </div>
        ))}
      </div>
    </section>
  );
}

export default function TableSkeleton({ rows = 5 }: TableSkeletonProps) {
  return (
    <div className="application-detail-list" aria-busy="true" aria-label="Loading applications…">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonApplicationDetail key={i} />
      ))}
    </div>
  );
}
