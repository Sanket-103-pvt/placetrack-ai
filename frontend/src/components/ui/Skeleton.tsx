// Skeleton.tsx — Base skeleton primitive components for loading states.
// Uses .skeleton-base CSS class (defined in globals.css) for a shimmer animation
// that adapts to dark/light mode via CSS custom properties.

import type { CSSProperties } from "react";

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: CSSProperties;
}

/** Single skeleton block — the lowest-level primitive. */
export function Skeleton({ width, height, borderRadius, className, style }: SkeletonProps) {
  return (
    <span
      className={`skeleton-base${className ? ` ${className}` : ""}`}
      style={{
        width: width ?? "100%",
        height: height ?? "14px",
        borderRadius: borderRadius ?? undefined,
        ...style
      }}
    />
  );
}

/** N stacked skeleton lines mimicking a block of text. */
export function SkeletonText({ rows = 3, gap = 8 }: { rows?: number; gap?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton
          key={i}
          height="12px"
          width={i === rows - 1 ? "65%" : "100%"}
        />
      ))}
    </div>
  );
}

/** Card-shaped skeleton block. */
export function SkeletonCard({ height = "120px", style }: { height?: string; style?: CSSProperties }) {
  return (
    <div
      className="card"
      style={{
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        ...style
      }}
    >
      <Skeleton height="14px" width="50%" />
      <Skeleton height={height} />
    </div>
  );
}

/** Skeleton that mimics a stat-card: icon placeholder + big number + label. */
export function SkeletonStatCard() {
  return (
    <div
      className="card stat-card"
      style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}
    >
      {/* Icon placeholder */}
      <Skeleton width="32px" height="32px" borderRadius="10px" />
      {/* Big number */}
      <Skeleton width="55%" height="22px" />
      {/* Label */}
      <Skeleton width="70%" height="11px" />
      {/* Sub-label */}
      <Skeleton width="45%" height="10px" />
    </div>
  );
}
