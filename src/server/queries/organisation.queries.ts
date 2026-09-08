import "server-only";
import { db } from "@/server/db";

export async function listDepartments(companyId: string) {
  return db.department.findMany({
    where: { companyId, deletedAt: null },
    select: { id: true, name: true, code: true, description: true, _count: { select: { employees: true } } },
    orderBy: { name: "asc" },
  });
}

export async function listDesignations(companyId: string) {
  return db.designation.findMany({
    where: { companyId },
    select: {
      id: true,
      title: true,
      code: true,
      level: true,
      department: { select: { name: true } },
      _count: { select: { employees: true } },
    },
    orderBy: { level: "asc" },
  });
}

export async function listOffices(companyId: string) {
  return db.officeLocation.findMany({
    where: { companyId },
    orderBy: { name: "asc" },
  });
}

export async function listHolidays(companyId: string) {
  const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));
  return db.holiday.findMany({
    where: { companyId, date: { gte: yearStart } },
    orderBy: { date: "asc" },
  });
}

export async function listUpcomingHolidays(companyId: string, take = 4) {
  const today = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()));
  return db.holiday.findMany({
    where: { companyId, date: { gte: today } },
    orderBy: { date: "asc" },
    take,
  });
}
