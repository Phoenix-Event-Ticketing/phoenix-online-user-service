import "dotenv/config";
import { defineConfig } from "prisma/config";

// `prisma generate` must run without a live DB (e.g. Docker build). Runtime and migrations require a real DATABASE_URL.
const datasourceUrl =
  process.env.DATABASE_URL ??
  "mysql://dummy:dummy@127.0.0.1:3306/dummy?connectionLimit=20";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "node prisma/seed.js",
  },
  datasource: {
    url: datasourceUrl,
  },
});
