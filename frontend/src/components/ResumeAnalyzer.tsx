"use client";

import { useState } from "react";
import { FileCheck2, Sparkles } from "lucide-react";

const example = `Aarav Mehta
aarav@example.com | +91 9876543210
Education: B.Tech Computer Science, CGPA 8.4
Skills: JavaScript, TypeScript, React, Node.js, Express, SQL, Git
Projects: Built a placement portal used by 500 students and reduced coordinator reporting time by 35%.
Experience: Software engineering intern. Improved API latency by 28%.
Achievements: Finalist, Smart India Hackathon.`;

type Result = { score: number; skills: string[]; suggestions: string[] };

export function ResumeAnalyzer() {
  const [text, setText] = useState(example);
  const [result, setResult] = useState<Result | null>(null);

  const analyze = () => {
    const lower = text.toLowerCase();
    const catalog = ["javascript", "typescript", "react", "node.js", "express", "python", "java", "sql", "git", "docker"];
    const skills = catalog.filter((skill) => lower.includes(skill));
    const sections = ["education", "experience", "projects", "skills", "achievements"].filter((item) => lower.includes(item));
    const metrics = text.match(/\b\d+(?:\.\d+)?%|\b\d+\s+(?:students|users|projects)/gi) ?? [];
    const score = Math.min(100, 30 + sections.length * 9 + skills.length * 3 + metrics.length * 5);
    const suggestions = [
      metrics.length < 2 ? "Add measurable impact to at least two project bullets." : "",
      skills.length < 5 ? "Add role-specific technical keywords." : "",
      !lower.includes("experience") ? "Add an Experience section, including internships." : ""
    ].filter(Boolean);
    setResult({ score, skills, suggestions });
  };

  return (
    <section className="analyzer-grid">
      <div>
        <div className="eyebrow"><Sparkles size={14} /> AI resume lab</div>
        <h2>Make every line earn its place.</h2>
        <p className="section-copy">Paste resume text for an instant ATS-style review. The offline analyzer checks structure, keywords, and quantified impact.</p>
        <textarea value={text} onChange={(event) => setText(event.target.value)} aria-label="Resume text" />
        <button className="primary-button" onClick={analyze}><Sparkles size={16} /> Analyze resume</button>
      </div>
      <div className="analysis-panel">
        {result ? (
          <>
            <div className="analysis-score">
              <FileCheck2 size={24} />
              <div><strong>{result.score}</strong><span>ATS score</span></div>
            </div>
            <div className="tag-list">{result.skills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            <h4>Next best edits</h4>
            {result.suggestions.length ? result.suggestions.map((item) => <p className="suggestion" key={item}>↗ {item}</p>) : <p className="suggestion success">✓ Strong structure and measurable impact. Tailor it to the job description next.</p>}
          </>
        ) : (
          <div className="empty-analysis">
            <div className="scan-lines"><i /><i /><i /><i /></div>
            <h3>Your analysis appears here</h3>
            <p>We’ll surface an ATS score, detected skills, and practical edits—not vague encouragement.</p>
          </div>
        )}
      </div>
    </section>
  );
}
