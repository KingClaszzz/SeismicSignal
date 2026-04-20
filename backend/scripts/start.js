const { spawnSync } = require("child_process");

const databaseUrl = process.env.DATABASE_URL || "";
const hasDatabase = databaseUrl.startsWith("postgresql://") || databaseUrl.startsWith("postgres://");

if (hasDatabase) {
  const migrate = spawnSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (migrate.status !== 0) {
    process.exit(migrate.status || 1);
  }
} else {
  console.warn("DATABASE_URL is missing or invalid. Starting API without database migration.");
}

const server = spawnSync("node", ["dist/index.js"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(server.status || 0);
