export interface ReadinessFeatures {
  cgpa: number;
  aptitudeAccuracy: number;
  codingScore: number;
  communicationScore: number;
  projects: number;
  internships: number;
  mockTests: number;
  backlogs: number;
}

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

export function predictReadiness(features: ReadinessFeatures) {
  const score = clamp(
    (features.cgpa / 10) * 22 +
    features.aptitudeAccuracy * 0.18 +
    features.codingScore * 0.22 +
    features.communicationScore * 0.15 +
    Math.min(features.projects, 4) * 4 +
    Math.min(features.internships, 2) * 5 +
    Math.min(features.mockTests, 10) * 1.2 -
    features.backlogs * 7
  );

  const metrics = [
    ["CGPA", features.cgpa * 10],
    ["Aptitude", features.aptitudeAccuracy],
    ["Coding", features.codingScore],
    ["Communication", features.communicationScore]
  ] as const;
  const strengths = metrics.filter(([, value]) => value >= 75).map(([name]) => name);
  const weaknesses = metrics.filter(([, value]) => value < 65).map(([name]) => name);

  return {
    score,
    category: score >= 80 ? "Placement ready" : score >= 65 ? "Nearly ready" : "Needs focused preparation",
    strengths,
    weaknesses,
    recommendation: weaknesses.length
      ? `Prioritize ${weaknesses.slice(0, 2).join(" and ")} for the next two weeks.`
      : "Keep momentum with timed mocks and company-specific interview practice."
  };
}
