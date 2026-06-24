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

  // Base score calculation for matching basic criteria
  const cgpaScore = Math.max(0, Math.min(25, Math.round((student.cgpa - drive.minCgpa) * 10) + 10)); // base 10, max 25
  const branchScore = drive.allowedBranches.includes(student.branch) ? 15 : 0;
  const backlogScore = student.backlogs <= drive.maxBacklogs ? 15 : 0;
  const batchScore = student.graduationYear === drive.graduationYear ? 10 : 0;

  // Dynamic Skill matching score
  let skillsScore = 0;
  const studentSkills = student.skills || [];
  if (studentSkills.length > 0 && (drive.role || drive.description)) {
    const textToMatch = `${drive.role || ""} ${drive.description || ""}`.toLowerCase();
    let matchedSkillsCount = 0;
    studentSkills.forEach((skill) => {
      if (skill && textToMatch.includes(skill.toLowerCase())) {
        matchedSkillsCount++;
      }
    });
    // Award 10 points per matched skill, up to 30 points
    skillsScore = Math.min(30, matchedSkillsCount * 10);
  }

  const score = Math.max(20, Math.min(99, cgpaScore + branchScore + backlogScore + batchScore + skillsScore));

  return { eligible: reasons.length === 0, reasons, score };
}

