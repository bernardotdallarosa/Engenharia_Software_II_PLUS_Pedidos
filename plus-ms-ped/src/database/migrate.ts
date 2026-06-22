import { initializeDatabase } from "./schema";

initializeDatabase()
  .then(() => {
    console.log("Database schema initialized");
  })
  .catch((error) => {
    console.error("Failed to initialize database schema", error);
    process.exitCode = 1;
  });
