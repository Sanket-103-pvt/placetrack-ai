"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronLeft, ChevronRight, Loader2, Plus, Sparkles } from "lucide-react";
import { api } from "../lib/api";
import { QuestionCard } from "./QuestionCard";
import { Skeleton } from "./ui/Skeleton";

interface Question {
  id: string;
  role: string;
  question: string;
  difficulty: string;
  category: string;
  modelAnswer: string | null;
  attempts?: any[];
}

interface PaginatedQuestions {
  total: number;
  pages: number;
  page: number;
  limit: number;
  items: Question[];
}

export default function PracticeView({ token, flash }: { token: string | null; flash: (msg: string) => void }) {
  const [questionsData, setQuestionsData] = useState<PaginatedQuestions | null>(null);
  const [roleFilter, setRoleFilter] = useState("SDE");
  const [difficultyFilter, setDifficultyFilter] = useState<"EASY" | "MEDIUM" | "HARD">("EASY");
  const [categoryFilter, setCategoryFilter] = useState("Technical");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const roles = ["SDE", "Data Analyst", "Core Engineering", "HR"];
  const categories = ["Technical", "Behavioral", "HR"];

  const fetchQuestions = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: "5"
      });
      if (roleFilter) query.append("role", roleFilter);
      if (difficultyFilter) query.append("difficulty", difficultyFilter);
      if (categoryFilter) query.append("category", categoryFilter);

      const data = await api<PaginatedQuestions>(`/api/questions?${query.toString()}`, token);
      setQuestionsData(data);
    } catch (err) {
      flash(err instanceof Error ? err.message : "Failed to load questions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [roleFilter, difficultyFilter, categoryFilter, page, token]);

  const handleGenerate = async () => {
    if (!token) return;
    setGenerating(true);
    try {
      await api("/api/questions/generate", token, {
        method: "POST",
        body: JSON.stringify({
          role: roleFilter,
          difficulty: difficultyFilter
        })
      });
      flash("New AI question generated and added to bank!");
      fetchQuestions();
    } catch (err) {
      flash(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      {/* Header and Generate Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 800, color: "var(--text)" }}>
            AI Interview Question Bank
          </h2>
          <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted)" }}>
            Select your preferences or trigger AI to generate personalized practice questions.
          </p>
        </div>

        <button
          className="primary-button"
          onClick={handleGenerate}
          disabled={generating || loading}
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          {generating ? (
            <Loader2 className="spin" size={16} />
          ) : (
            <Sparkles size={14} style={{ color: "var(--warning)" }} />
          )}
          Generate New Question
        </button>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          display: "flex",
          gap: "16px",
          flexWrap: "wrap",
          alignItems: "center",
          background: "var(--panel)"
        }}
      >
        {/* Role select */}
        <div style={{ display: "grid", gap: "6px", flex: 1, minWidth: "140px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            Target Role
          </label>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "8px 12px",
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              color: "var(--text)",
              fontSize: "12px",
              outline: "none"
            }}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Category select */}
        <div style={{ display: "grid", gap: "6px", flex: 1, minWidth: "140px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            Category
          </label>
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: "8px 12px",
              background: "var(--panel-2)",
              border: "1px solid var(--line)",
              borderRadius: "8px",
              color: "var(--text)",
              fontSize: "12px",
              outline: "none"
            }}
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Selector */}
        <div style={{ display: "grid", gap: "6px", flex: 1, minWidth: "200px" }}>
          <label style={{ fontSize: "10px", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>
            Difficulty
          </label>
          <div style={{ display: "flex", gap: "6px" }}>
            {(["EASY", "MEDIUM", "HARD"] as const).map((diff) => {
              const active = difficultyFilter === diff;
              const color = diff === "EASY" ? "#22C55E" : diff === "MEDIUM" ? "#F59E0B" : "#EF4444";
              return (
                <button
                  key={diff}
                  onClick={() => {
                    setDifficultyFilter(diff);
                    setPage(1);
                  }}
                  type="button"
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    fontSize: "11px",
                    fontWeight: 700,
                    borderRadius: "8px",
                    border: active ? `1px solid ${color}` : "1px solid var(--line)",
                    background: active ? `${color}15` : "var(--panel-2)",
                    color: active ? color : "var(--muted)",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  {diff}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Question Cards List */}
      <div style={{ display: "grid", gap: "16px" }}>
        {loading ? (
          Array.from({ length: 3 }).map((_, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                height: "180px"
              }}
            >
              <div style={{ display: "flex", gap: "8px" }}>
                <Skeleton width="60px" height="18px" borderRadius="6px" />
                <Skeleton width="80px" height="18px" borderRadius="6px" />
              </div>
              <Skeleton width="80%" height="22px" />
              <Skeleton width="100%" height="60px" borderRadius="10px" />
            </div>
          ))
        ) : questionsData && questionsData.items.length > 0 ? (
          <>
            {questionsData.items.map((q) => (
              <QuestionCard key={q.id} question={q} token={token} flash={flash} />
            ))}

            {/* Pagination Controls */}
            {questionsData.pages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
                <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                  Page <b>{page}</b> of <b>{questionsData.pages}</b> ({questionsData.total} questions)
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    className="secondary-button"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                    style={{ padding: "8px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <ChevronLeft size={14} /> Prev
                  </button>
                  <button
                    className="secondary-button"
                    disabled={page === questionsData.pages}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ padding: "8px 12px", borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    Next <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center", color: "var(--muted)" }}>
            <Sparkles size={32} style={{ opacity: 0.15, marginBottom: "12px" }} />
            <strong style={{ display: "block", color: "var(--text)", marginBottom: "4px" }}>
              No practice questions found
            </strong>
            <p style={{ margin: 0, fontSize: "12px" }}>
              Try loosening your filters or click "Generate New Question" to create one with AI.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
