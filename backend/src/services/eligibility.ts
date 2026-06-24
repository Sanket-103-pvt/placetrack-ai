export interface StudentProfile {
  cgpa: number;
  branch: string;
  backlogs: number;
  graduationYear: number;
  skills?: string[] | null;
}

export interface DriveCriteria {
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  graduationYear: number;
  role?: string | null;
  description?: string | null;
}

export function checkEligibility(student: StudentProfile, drive: DriveCriteria) {
  const reasons: string[] = [];
  if (student.cgpa < drive.minCgpa) reasons.push(`CGPA must be at least ${drive.minCgpa}`);
  if (!drive.allowedBranches.includes(student.branch)) reasons.push(`${student.branch} is not an allowed branch`);
  if (student.backlogs > drive.maxBacklogs) reasons.push(`Maximum ${drive.maxBacklogs} active backlogs allowed`);
  if (student.graduationYear !== drive.graduationYear) reasons.push(`Drive is for the ${drive.graduationYear} batch`);

  if (reasons.length > 0) {
    return { eligible: false, reasons, score: 0 };
  }

  // Base score for eligible candidates starts at 50
  let score = 50;

  // 1. CGPA performance bonus (up to 15 points)
  const cgpaDiff = student.cgpa - drive.minCgpa;
  const cgpaBonus = Math.max(0, Math.min(15, Math.round(cgpaDiff * 10)));
  score += cgpaBonus;

  // 2. Skill matching bonus (up to 30 points)
  let skillsBonus = 0;
  const studentSkills = student.skills || [];
  const textToMatch = `${drive.role || ""} ${drive.description || ""}`.toLowerCase();
  
  if (studentSkills.length > 0) {
    let matchedCount = 0;
    studentSkills.forEach((skill) => {
      if (skill && textToMatch.includes(skill.toLowerCase())) {
        matchedCount++;
      }
    });
    skillsBonus = Math.min(30, matchedCount * 10);
  }
  score += skillsBonus;

  // 3. Branch specificity bonus (up to 15 points)
  if (drive.allowedBranches.length <= 2 && drive.allowedBranches.includes(student.branch)) {
    score += 10;
    if (student.branch === "AI & Data Science" && (textToMatch.includes("data science") || textToMatch.includes("ai") || textToMatch.includes("analyst"))) {
      score += 5;
    }
  }

  const finalScore = Math.max(50, Math.min(100, score));

  return { eligible: true, reasons, score: finalScore };
}

