import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { seedDatabase } from "./seedData";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://devpulse:devpulse@localhost:5434/devpulse";

const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log("🌱 Seeding database...");
  await seedDatabase(db, Math.random, console.log);
  console.log("✅ Seed complete!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
