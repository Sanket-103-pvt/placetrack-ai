export const drives = [
  { id: "drv-1", company: "Atlassian", role: "Graduate Software Engineer", package: 24, location: "Bengaluru", minCgpa: 7.5, branches: ["CSE", "IT", "ECE"], maxBacklogs: 0, deadline: "2026-07-05", applicants: 184, match: 96 },
  { id: "drv-2", company: "Deloitte", role: "Technology Analyst", package: 8.5, location: "Hyderabad", minCgpa: 6.5, branches: ["CSE", "IT", "ECE", "EEE"], maxBacklogs: 1, deadline: "2026-07-12", applicants: 312, match: 89 },
  { id: "drv-3", company: "Siemens", role: "Software Developer", package: 12, location: "Pune", minCgpa: 7, branches: ["CSE", "IT", "ECE", "EEE"], maxBacklogs: 0, deadline: "2026-07-18", applicants: 143, match: 92 },
  { id: "drv-4", company: "Razorpay", role: "Product Engineer", package: 18, location: "Bengaluru", minCgpa: 8, branches: ["CSE", "IT"], maxBacklogs: 0, deadline: "2026-07-25", applicants: 97, match: 84 }
];

export const dashboard = {
  student: { name: "Aarav Mehta", branch: "CSE", cgpa: 8.41, readiness: 78, applications: 8, interviews: 2, offers: 1 },
  applications: [
    { company: "Atlassian", role: "Graduate Software Engineer", status: "Technical Round", date: "Jun 28", color: "#7c5cff" },
    { company: "Deloitte", role: "Technology Analyst", status: "Aptitude Cleared", date: "Jul 02", color: "#39c6b4" },
    { company: "Siemens", role: "Software Developer", status: "Shortlisted", date: "Jul 08", color: "#ffb454" }
  ],
  trend: [
    { month: "Jan", score: 54 }, { month: "Feb", score: 59 }, { month: "Mar", score: 63 },
    { month: "Apr", score: 68 }, { month: "May", score: 72 }, { month: "Jun", score: 78 }
  ],
  branchPerformance: [
    { branch: "CSE", placed: 82 }, { branch: "IT", placed: 76 }, { branch: "ECE", placed: 68 },
    { branch: "EEE", placed: 61 }, { branch: "ME", placed: 54 }
  ]
};
