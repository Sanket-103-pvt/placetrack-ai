"use client";

import { motion } from "framer-motion";

export function ReadinessRing({ value }: { value: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (value / 100) * circumference;
  
  // Dynamic status text
  const statusLabel = value >= 80 ? "Placement Ready" : value >= 65 ? "Nearly Ready" : "Needs Prep";
  const statusColor = value >= 80 ? "#22C55E" : value >= 65 ? "#F59E0B" : "#EF4444";

  return (
    <div className="readiness-ring" aria-label={`Readiness score ${value} out of 100`}>
      <svg viewBox="0 0 128 128">
        <defs>
          <linearGradient id="score-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="var(--secondary)" />
            <stop offset="1" stopColor="var(--violet)" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Outer subtle glow track */}
        <circle className="ring-track" cx="64" cy="64" r="54" style={{ strokeWidth: 6, opacity: 0.12 }} />
        
        {/* Main background track */}
        <circle className="ring-track" cx="64" cy="64" r="54" style={{ strokeWidth: 8 }} />
        
        {/* Glowing progress line */}
        <motion.circle
          className="ring-value"
          cx="64"
          cy="64"
          r="54"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={{
            stroke: "url(#score-gradient)",
            strokeWidth: 8,
            filter: "drop-shadow(0px 0px 5px rgba(136, 189, 242, 0.5))"
          }}
        />
        
        {/* Inner center mask for glassmorphic depth */}
        <circle cx="64" cy="64" r="46" fill="rgba(11, 11, 18, 0.25)" />
      </svg>
      <div className="ring-label">
        <strong style={{ background: "linear-gradient(135deg, var(--text), var(--secondary))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {value}%
        </strong>
        <span style={{ color: statusColor, fontWeight: 700, fontSize: "9px", letterSpacing: "0.05em", marginTop: "3px", textTransform: "uppercase" }}>
          {statusLabel}
        </span>
      </div>
    </div>
  );
}
