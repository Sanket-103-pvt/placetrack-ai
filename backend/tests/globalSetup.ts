import { execSync } from "child_process";
import dotenv from "dotenv";

export default async function globalSetup() {
  dotenv.config();

  const testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl) {
    throw new Error("TEST_DATABASE_URL is not defined in .env file");
  }

  process.env.DATABASE_URL = testDbUrl;
  process.env.DIRECT_URL = testDbUrl;

  console.log("\n[Jest Global Setup] Resetting and migrating test database schema...");
  try {
    // Run db push to update schema in the test database
    execSync("npx prisma db push --accept-data-loss", {
      env: { ...process.env, DATABASE_URL: testDbUrl, DIRECT_URL: testDbUrl },
      stdio: "inherit",
    });
    console.log("[Jest Global Setup] Test database migrated successfully.");
  } catch (error) {
    console.error("[Jest Global Setup] Error migrating test database schema:", error);
    throw error;
  }
}
