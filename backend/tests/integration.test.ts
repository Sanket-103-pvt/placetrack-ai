import request from "supertest";
import { app } from "../src/server.js";
import { prisma } from "../src/lib/prisma.js";
import { signToken } from "../src/middleware/auth.js";
import bcrypt from "bcryptjs";

describe("PlaceTrack AI - Backend Integration Tests", () => {
  let studentToken: string;
  let adminToken: string;
  let studentUserId: string;
  let studentId: string;
  let adminUserId: string;
  let driveId: string;
  let ineligibleDriveId: string;
  let applicationId: string;

  beforeAll(async () => {
    // 1. Clean up existing data in correct sequence to prevent foreign key errors
    await prisma.questionAttempt.deleteMany();
    await prisma.interviewQuestion.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.application.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.activityLog.deleteMany();
    await prisma.testResult.deleteMany();
    await prisma.resumeAnalysis.deleteMany();
    await prisma.student.deleteMany();
    await prisma.coordinator.deleteMany();
    await prisma.placementDrive.deleteMany();
    await prisma.company.deleteMany();
    await prisma.user.deleteMany();

    // 2. Hash password
    const passwordHash = await bcrypt.hash("password123", 10);

    // 3. Create student user and profile
    const studentUser = await prisma.user.create({
      data: {
        email: "student@example.com",
        passwordHash,
        role: "STUDENT",
        student: {
          create: {
            name: "Jane Doe",
            branch: "Computer Science",
            cgpa: 8.5,
            graduationYear: 2027,
            skills: ["JavaScript", "TypeScript", "React"],
            backlogs: 0,
            readinessScore: 85
          }
        }
      },
      include: { student: true }
    });
    studentUserId = studentUser.id;
    studentId = studentUser.student!.id;
    studentToken = signToken(studentUserId, "STUDENT");

    // 4. Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "admin@example.com",
        passwordHash,
        role: "ADMIN"
      }
    });
    adminUserId = adminUser.id;
    adminToken = signToken(adminUserId, "ADMIN");

    // 5. Create company and drive
    const company = await prisma.company.create({
      data: {
        name: "Google",
        website: "https://google.com"
      }
    });

    const drive = await prisma.placementDrive.create({
      data: {
        companyId: company.id,
        role: "Software Engineer",
        package: 30.0,
        location: "Mountain View, CA",
        jobType: "FULL_TIME",
        description: "Software engineering role",
        minCgpa: 7.0,
        allowedBranches: ["Computer Science"],
        maxBacklogs: 0,
        graduationYear: 2027,
        deadline: new Date(Date.now() + 86400000 * 5)
      }
    });
    driveId = drive.id;

    // Create an ineligible drive (requires 9.5 CGPA, student has 8.5)
    const ineligibleDrive = await prisma.placementDrive.create({
      data: {
        companyId: company.id,
        role: "Principal Engineer",
        package: 80.0,
        location: "Mountain View, CA",
        jobType: "FULL_TIME",
        description: "Principal engineering role",
        minCgpa: 9.5,
        allowedBranches: ["Computer Science"],
        maxBacklogs: 0,
        graduationYear: 2027,
        deadline: new Date(Date.now() + 86400000 * 5)
      }
    });
    ineligibleDriveId = ineligibleDrive.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("POST /api/auth/signup", () => {
    it("creates a new student user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "John Smith",
          email: "john@example.com",
          password: "password123",
          role: "STUDENT",
          branch: "Electrical Engineering",
          cgpa: 8.0,
          graduationYear: 2026,
          skills: ["Python", "MATLAB"],
          backlogs: 0
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("john@example.com");
      expect(response.body.user.role).toBe("STUDENT");
      expect(response.body.user.student).toBeDefined();
    });

    it("returns 409 conflict for existing email", async () => {
      const response = await request(app)
        .post("/api/auth/signup")
        .send({
          name: "Jane Doe Copy",
          email: "student@example.com",
          password: "password123"
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe("Email already registered");
    });
  });

  describe("POST /api/auth/login", () => {
    it("authenticates student user successfully", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "student@example.com",
          password: "password123"
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body.user.email).toBe("student@example.com");
    });

    it("returns 401 for invalid credentials", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({
          email: "student@example.com",
          password: "wrongpassword"
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toBe("Invalid email or password");
    });
  });

  describe("GET /api/drives", () => {
    it("returns list of drives for student", async () => {
      const response = await request(app)
        .get("/api/drives")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      const engDrive = response.body.find((d: any) => d.id === driveId);
      expect(engDrive).toBeDefined();
      expect(engDrive.company.name).toBe("Google");
    });

    it("returns 401 if unauthenticated", async () => {
      const response = await request(app).get("/api/drives");
      expect(response.status).toBe(401);
    });
  });

  describe("POST /api/applications", () => {
    it("submits application successfully if eligible", async () => {
      const response = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ driveId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("id");
      expect(response.body.studentId).toBe(studentId);
      expect(response.body.driveId).toBe(driveId);
      applicationId = response.body.id;
    });

    it("returns 422 for ineligible drive applications", async () => {
      const response = await request(app)
        .post("/api/applications")
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ driveId: ineligibleDriveId });

      expect(response.status).toBe(422);
      expect(response.body.error).toBe("Not eligible");
    });
  });

  describe("PATCH /api/applications/:id/status", () => {
    it("updates application status successfully by admin/coordinator", async () => {
      const response = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "SHORTLISTED",
          note: "Passed initial screening"
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe("SHORTLISTED");
    });

    it("returns 403 for unauthorized status changes", async () => {
      const response = await request(app)
        .patch(`/api/applications/${applicationId}/status`)
        .set("Authorization", `Bearer ${studentToken}`)
        .send({ status: "SHORTLISTED" });

      expect(response.status).toBe(403);
    });
  });

  describe("GET /api/reports/analytics", () => {
    it("returns analytics grouping to coordinator/admin", async () => {
      const response = await request(app)
        .get("/api/reports/analytics")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("historicalTrends");
      expect(response.body).toHaveProperty("packageDistribution");
    });

    it("returns 403 to student role", async () => {
      const response = await request(app)
        .get("/api/reports/analytics")
        .set("Authorization", `Bearer ${studentToken}`);

      expect(response.status).toBe(403);
    });
  });
});
