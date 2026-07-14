// OpportunityCardSkeleton.tsx — Skeleton mimicking an opportunity-card layout.
// Used in the Opportunities view while drive data is loading.

import { Skeleton } from "./Skeleton";

export default function OpportunityCardSkeleton() {
  return (
    <article
      className="card opportunity-card"
      aria-hidden="true"
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "24px",
        gap: "14px",
        borderTop: "4px solid var(--line)"
      }}
    >
      {/* Badge row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Skeleton width="72px" height="22px" borderRadius="6px" />
        <Skeleton width="80px" height="22px" borderRadius="6px" />
      </div>

      {/* Company logo + name */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <Skeleton width="48px" height="48px" borderRadius="14px" style={{ flexShrink: 0 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: "7px", flex: 1 }}>
          <Skeleton width="55%" height="16px" />
          <Skeleton width="40%" height="12px" />
        </div>
      </div>

      {/* Description line */}
      <Skeleton width="90%" height="11px" />
      <Skeleton width="70%" height="11px" />

      {/* Tags row */}
      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
        <Skeleton width="60px" height="22px" borderRadius="20px" />
        <Skeleton width="80px" height="22px" borderRadius="20px" />
        <Skeleton width="50px" height="22px" borderRadius="20px" />
      </div>

      {/* CTA button */}
      <Skeleton height="40px" borderRadius="12px" style={{ marginTop: "auto" }} />
    </article>
  );
}
