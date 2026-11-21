
import "dotenv/config";
import app from "./app.js";
import prisma from "./config/db.js";
const PORT = Number(process.env.PORT) || 5000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("PostgreSQL connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();

// app.listen(PORT, () => {
//   console.log(`CertiFlow API running on port ${PORT}`);
// });
