
import "dotenv/config";
import bcrypt from "bcrypt";
import  prisma  from "../src/config/db";

async function main() {
  const demoPassword = process.env.DEMO_PASSWORD;

  if (!demoPassword) {
    throw new Error("DEMO_PASSWORD is missing from .env");
  }

  const hashedPassword = await bcrypt.hash(demoPassword, 12);

  // Create or update the demo training centre
  const trainingCentre = await prisma.trainingCentre.upsert({
    where: {
      code: "CENTRE-HYD-001",
    },
    update: {
      name: "Pragati Training Centre",
      district: "Hyderabad",
    },
    create: {
      name: "Pragati Training Centre",
      code: "CENTRE-HYD-001",
      district: "Hyderabad",
      address: "Hyderabad, Telangana",
    },
  });

  // Demo user accounts
  const demoUsers = [
    {
      name: "Anika",
      email: "anika@certiflow.demo",
      role: "TRAINING_CENTRE" as const,
      district: null,
      trainingCentreId: trainingCentre.id,
    },
    {
      name: "Dev",
      email: "dev@certiflow.demo",
      role: "DISTRICT_OFFICER" as const,
      district: "Hyderabad",
      trainingCentreId: null,
    },
    {
      name: "Meera",
      email: "meera@certiflow.demo",
      role: "DISTRICT_OFFICER" as const,
      district: "Hyderabad",
      trainingCentreId: null,
    },
    {
      name: "Kabir",
      email: "kabir@certiflow.demo",
      role: "DISTRICT_OFFICER" as const,
      district: "Hyderabad",
      trainingCentreId: null,
    },
    {
      name: "Neha",
      email: "neha@certiflow.demo",
      role: "QUALITY_OFFICER" as const,
      district: null,
      trainingCentreId: null,
    },
    {
      name: "Farah",
      email: "farah@certiflow.demo",
      role: "STATE_OFFICER" as const,
      district: null,
      trainingCentreId: null,
    },
  ];

  console.log("Starting CertiFlow demo user seeding...\n");

  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: {
        email: user.email,
      },
      update: {
        name: user.name,
        password: hashedPassword,
        role: user.role,
        district: user.district,
        trainingCentreId: user.trainingCentreId,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: user.role,
        district: user.district,
        trainingCentreId: user.trainingCentreId,
      },
    });

    console.log(`Created/updated: ${user.name} (${user.role})`);
  }

  console.log("\nCertiFlow demo users seeded successfully!");
}

main()
  .catch((error) => {
    console.error("Demo seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
