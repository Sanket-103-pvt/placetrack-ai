// DashboardSkeleton.tsx — Full dashboard overview skeleton.
// Mirrors the layout of the Overview component: hero card, hero-grid, mid-grid.
// Shown when loading === true and dashboard data hasn't arrived yet.

import { Skeleton, SkeletonStatCard, SkeletonText } from "./Skeleton";

function SkeletonReadinessCard() {
  return (
    <div className="card readiness-card" style={{ padding: "22px" }}>
      <div className="card-head" style={{ marginBottom: "16px" }}>
        <div>
          <Skeleton width="90px" height="9px" />
          <Skeleton width="140px" height="16px" style={{ marginTop: "6px" }} />
        </div>
      </div>
      <div className="readiness-body">
        {/* Ring placeholder */}
        <div style={{
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          flexShrink: 0,
          overflow: "hidden"
        }}>
          <Skeleton width="120px" height="120px" borderRadius="50%" />
        </div>
        <div className="score-breakdown" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          <Skeleton width="80px" height="11px" />
          <Skeleton width="60px" height="11px" />
          <Skeleton width="100px" height="11px" />
          <Skeleton width="90%" height="11px" />
        </div>
      </div>
    </div>
  );
}

function SkeletonApplicationRow() {
  return (
    <div className="application-row" style={{ display: "grid", gridTemplateColumns: "36px 1fr auto", gap: "10px", alignItems: "center", padding: "10px 0" }}>
      <Skeleton width="36px" height="36px" borderRadius="10px" />
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <Skeleton width="55%" height="12px" />
        <Skeleton width="35%" height="10px" />
      </div>
      <Skeleton width="72px" height="22px" borderRadius="20px" />
    </div>
  );
}

export default function DashboardSkeleton() {
  return (
    <>
      {/* Hero welcome card */}
      <div className="card" style={{
        padding: "32px",
        marginBottom: "30px",
        borderRadius: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "16px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            {/* Avatar placeholder */}
            <Skeleton width="64px" height="64px" borderRadius="18px" style={{ flexShrink: 0 }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <Skeleton width="70px" height="9px" />
              <Skeleton width="220px" height="22px" />
              <Skeleton width="160px" height="12px" />
            </div>
          </div>
          <Skeleton width="180px" height="32px" borderRadius="20px" />
        </div>
        <div style={{ paddingTop: "20px", borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", gap: "32px" }}>
            {[80, 90, 80].map((w, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <Skeleton width="70px" height="9px" />
                <Skeleton width={`${w}px`} height="16px" />
              </div>
            ))}
          </div>
          <Skeleton width="220px" height="34px" borderRadius="12px" />
        </div>
      </div>

      {/* hero-grid: readiness card + 4 stat cards */}
      <section className="hero-grid">
        <SkeletonReadinessCard />
        <div className="stats-grid">
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
          <SkeletonStatCard />
        </div>
      </section>

      {/* mid-grid: application list + upcoming card */}
      <section className="mid-grid">
        <div className="card applications-card">
          <div className="card-head" style={{ marginBottom: "8px" }}>
            <div>
              <Skeleton width="50px" height="9px" />
              <Skeleton width="110px" height="16px" style={{ marginTop: "6px" }} />
            </div>
          </div>
          <div style={{ borderTop: "1px solid var(--line)" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonApplicationRow key={i} />
            ))}
          </div>
        </div>
        <div className="card upcoming-card" style={{ padding: "22px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <Skeleton width="50px" height="9px" />
            <Skeleton width="120px" height="16px" style={{ marginTop: "6px" }} />
          </div>
          <Skeleton width="54px" height="60px" borderRadius="12px" />
          <SkeletonText rows={3} />
          <Skeleton height="40px" borderRadius="12px" />
        </div>
      </section>
    </>
  );
}
