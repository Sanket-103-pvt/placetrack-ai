export interface StudentProfile {
  cgpa: number;
  branch: string;
  backlogs: number;
  graduationYear: number;
}

export interface DriveCriteria {
  minCgpa: number;
  allowedBranches: string[];
  maxBacklogs: number;
  graduationYear: number;
}

export function checkEligibility(student: StudentProfile, drive: DriveCriteria) {
  const reasons: string[] = [];
  if (student.cgpa < drive.minCgpa) reasons.push(`CGPA must be at least ${drive.minCgpa}`);
  if (!drive.allowedBranches.includes(student.branch)) reasons.push(`${student.branch} is not an allowed branch`);
  if (student.backlogs > drive.maxBacklogs) reasons.push(`Maximum ${drive.maxBacklogs} active backlogs allowed`);
  if (student.graduationYear !== drive.graduationYear) reasons.push(`Drive is for the ${drive.graduationYear} batch`);

  const cgpaScore = Math.max(0, Math.min(35, Math.round((student.cgpa - drive.minCgpa + 1.5) * 12)));
  const branchScore = drive.allowedBranches.includes(student.branch) ? 25 : 5;
  const backlogScore = student.backlogs <= drive.maxBacklogs ? 20 : Math.max(0, 12 - (student.backlogs - drive.maxBacklogs) * 6);
  const batchScore = student.graduationYear === drive.graduationYear ? 10 : 0;
  const stretchBonus = student.cgpa >= drive.minCgpa + 1 ? 10 : student.cgpa >= drive.minCgpa + 0.4 ? 5 : 0;
  const score = Math.max(12, Math.min(99, cgpaScore + branchScore + backlogScore + batchScore + stretchBonus));

  return { eligible: reasons.length === 0, reasons, score };
}
