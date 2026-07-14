// ProfileCardExport.tsx — Off-screen styled card captured by html2canvas for PNG export.
// IMPORTANT: All styles are hardcoded inline (no CSS custom properties) because
// html2canvas cannot resolve CSS variables at capture time.

"use client";

import { forwardRef } from "react";

interface StudentData {
  name: string;
  branch: string;
  cgpa: number;
  graduationYear: number;
  skills: string[];
  backlogs?: number;
  projectsCount?: number;
  internshipsCount?: number;
  mockTestCount?: number;
}

interface ProfileCardExportProps {
  student: StudentData;
  readinessScore: number;
}

// Self-contained inline SVG ring — no CSS vars, no framer-motion
function ExportRing({ value }: { value: number }) {
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (value / 100) * circumference;
  const color = value >= 80 ? "#22C55E" : value >= 65 ? "#F59E0B" : "#EF4444";
  const label = value >= 80 ? "Placement Ready" : value >= 65 ? "Nearly Ready" : "Needs Preparation";

  return (
    <div style={{ position: "relative", width: "140px", height: "140px", flexShrink: 0 }}>
      <svg viewBox="0 0 128 128" width="140" height="140">
        {/* Track */}
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        {/* Progress arc */}
        <circle
          cx="64" cy="64" r={r}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 64 64)"
          style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
        />
        {/* Inner mask for depth */}
        <circle cx="64" cy="64" r="46" fill="rgba(11,11,18,0.4)" />
      </svg>
      {/* Center label */}
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "2px"
      }}>
        <span style={{ fontSize: "26px", fontWeight: 800, color: "#FFFFFF", lineHeight: 1 }}>
          {value}%
        </span>
        <span style={{ fontSize: "8px", fontWeight: 700, color, letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// PlaceTrack AI logomark using inline SVG (no lucide-react to avoid font issues in canvas)
function LogoMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#88BDF2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
    </svg>
  );
}

const ProfileCardExport = forwardRef<HTMLDivElement, ProfileCardExportProps>(
  ({ student, readinessScore }, ref) => {
    const topSkills = student.skills.slice(0, 5);
    const generatedDate = new Date().toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric"
    });
    const statusColor = readinessScore >= 80 ? "#22C55E" : readinessScore >= 65 ? "#F59E0B" : "#EF4444";
    const statusBg = readinessScore >= 80 ? "rgba(34,197,94,0.15)" : readinessScore >= 65 ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)";
    const statusLabel = readinessScore >= 80 ? "Placement Ready" : readinessScore >= 65 ? "Nearly Ready" : "Needs Preparation";

    return (
      <div
        ref={ref}
        style={{
          // Hidden off-screen — rendered but not visible until capture
          position: "fixed",
          top: "-9999px",
          left: "-9999px",
          zIndex: -1,
          // Card dimensions — 3:1.7 social card aspect ratio
          width: "600px",
          height: "340px",
          borderRadius: "20px",
          overflow: "hidden",
          // Fully self-contained gradient background
          background: "linear-gradient(135deg, #0B0B12 0%, #111126 45%, #0D0D1F 100%)",
          border: "1px solid rgba(136,189,242,0.12)",
          boxShadow: "0 0 60px rgba(136,189,242,0.06) inset",
          padding: "32px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif"
        }}
      >
        {/* Decorative glow orbs */}
        <div style={{
          position: "absolute", top: "-60px", right: "-60px",
          width: "220px", height: "220px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(136,189,242,0.08) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />
        <div style={{
          position: "absolute", bottom: "-40px", left: "30%",
          width: "160px", height: "160px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(106,137,167,0.06) 0%, transparent 70%)",
          pointerEvents: "none"
        }} />

        {/* ── TOP ROW: Logo + Status badge ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <LogoMark />
            <span style={{ fontSize: "14px", fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em" }}>
              PlaceTrack <span style={{ color: "#88BDF2" }}>AI</span>
            </span>
          </div>
          <div style={{
            background: statusBg,
            border: `1px solid ${statusColor}40`,
            color: statusColor,
            padding: "5px 12px",
            borderRadius: "20px",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase"
          }}>
            {statusLabel}
          </div>
        </div>

        {/* ── MAIN CONTENT: Name + Meta + Ring ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", zIndex: 1 }}>
          {/* Left: student info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: "0 0 4px", fontSize: "10px", fontWeight: 700, color: "#88BDF2", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Student Readiness Profile
            </p>
            <h2 style={{
              margin: "0 0 6px",
              fontSize: "28px",
              fontWeight: 800,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}>
              {student.name}
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: "12px", color: "#A1A1AA" }}>
              {student.branch} &nbsp;·&nbsp; Class of {student.graduationYear}
            </p>

            {/* Stat chips: CGPA, Projects, Internships */}
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
              <div style={{
                background: "rgba(136,189,242,0.1)", border: "1px solid rgba(136,189,242,0.2)",
                padding: "4px 10px", borderRadius: "8px", fontSize: "11px", color: "#88BDF2", fontWeight: 700
              }}>
                CGPA {student.cgpa.toFixed(1)}
              </div>
              {(student.projectsCount ?? 0) > 0 && (
                <div style={{
                  background: "rgba(106,137,167,0.12)", border: "1px solid rgba(106,137,167,0.2)",
                  padding: "4px 10px", borderRadius: "8px", fontSize: "11px", color: "#6A89A7", fontWeight: 600
                }}>
                  {student.projectsCount} Projects
                </div>
              )}
              {(student.internshipsCount ?? 0) > 0 && (
                <div style={{
                  background: "rgba(106,137,167,0.12)", border: "1px solid rgba(106,137,167,0.2)",
                  padding: "4px 10px", borderRadius: "8px", fontSize: "11px", color: "#6A89A7", fontWeight: 600
                }}>
                  {student.internshipsCount} Internships
                </div>
              )}
            </div>

            {/* Skills pills */}
            {topSkills.length > 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {topSkills.map((skill) => (
                  <span key={skill} style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#BDDDFC",
                    padding: "3px 9px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: 500
                  }}>
                    {skill}
                  </span>
                ))}
                {student.skills.length > 5 && (
                  <span style={{
                    background: "transparent",
                    color: "#A1A1AA",
                    padding: "3px 6px",
                    fontSize: "10px"
                  }}>
                    +{student.skills.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right: readiness ring */}
          <ExportRing value={readinessScore} />
        </div>

        {/* ── BOTTOM ROW: KK Wagh label + generated date ── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{
              width: "6px", height: "6px", borderRadius: "50%",
              background: "linear-gradient(135deg, #88BDF2, #6A89A7)"
            }} />
            <span style={{ fontSize: "9px", color: "#6A89A7", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              KK Wagh Engineering · PlaceTrack AI
            </span>
          </div>
          <span style={{ fontSize: "9px", color: "#52525B" }}>
            Generated {generatedDate}
          </span>
        </div>
      </div>
    );
  }
);

ProfileCardExport.displayName = "ProfileCardExport";
export default ProfileCardExport;
