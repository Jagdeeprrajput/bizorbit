import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const company = await db.company.upsert({
    where: { slug: "bizorbit" },
    update: {},
    create: {
      name: "BizOrbit",
      slug: "bizorbit",
      timezone: "Asia/Kolkata",
      defaultCurrency: "INR",
    },
  });

  const office = await db.officeLocation.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      companyId: company.id,
      name: "Head Office",
      addressLine1: "TBD",
      city: "Bengaluru",
      state: "Karnataka",
      country: "India",
      postalCode: "560001",
      latitude: 12.9716,
      longitude: 77.5946,
      timezone: "Asia/Kolkata",
    },
  });

  const departments = [
    { name: "Engineering", code: "ENG" },
    { name: "Human Resources", code: "HR" },
    { name: "Operations", code: "OPS" },
  ];

  for (const dept of departments) {
    await db.department.upsert({
      where: { companyId_code: { companyId: company.id, code: dept.code } },
      update: {},
      create: { companyId: company.id, name: dept.name, code: dept.code },
    });
  }

  console.log(`Seeded company "${company.name}" with office "${office.name}" and ${departments.length} departments.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
