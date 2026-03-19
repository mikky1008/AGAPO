/**
 * System Prioritization Logic for Senior Citizen Assistance
 * Barangay San Francisco
 *
 * Risk factors:
 * - Health Status: Good(1), Fair(2), Poor(3)
 * - Income Level: Above Average(1), Average(2), Below Average(3), Low(4)
 * - Living Status: With Caregiver(1), With Family(1), Living Alone(2)
 * - Age: 60-69(1), 70-79(2), 80+(3)
 * - Illness count: 0(0), 1(1), 2+(2)
 */

export interface PriorityResult {
  score: number;
  level: "High" | "Medium" | "Low";
  factors: { label: string; risk: number; maxRisk: number }[];
}

export function computePriority(senior: {
  birth_date: string;
  health_status: string;
  income_level: string;
  living_status: string;
  illnesses: string[] | null;
}): PriorityResult {
  const age = calculateAge(senior.birth_date);
  const factors: PriorityResult["factors"] = [];

  // Health Status (1-3)
  const healthMap: Record<string, number> = { Good: 1, Fair: 2, Poor: 3 };
  const healthRisk = healthMap[senior.health_status] ?? 1;
  factors.push({ label: `Health: ${senior.health_status}`, risk: healthRisk, maxRisk: 3 });

  // Income Level (1-4)
  const incomeMap: Record<string, number> = {
    "Above Average": 1,
    Average: 2,
    "Below Average": 3,
    Low: 4,
  };
  const incomeRisk = incomeMap[senior.income_level] ?? 1;
  factors.push({ label: `Income: ${senior.income_level}`, risk: incomeRisk, maxRisk: 4 });

  // Living Status (1-2)
  const livingMap: Record<string, number> = {
    "With Caregiver": 1,
    "With Family": 1,
    "Living Alone": 2,
  };
  const livingRisk = livingMap[senior.living_status] ?? 1;
  factors.push({ label: `Living: ${senior.living_status}`, risk: livingRisk, maxRisk: 2 });

  // Age (1-3)
  let ageRisk = 1;
  if (age >= 80) ageRisk = 3;
  else if (age >= 70) ageRisk = 2;
  factors.push({ label: `Age: ${age}`, risk: ageRisk, maxRisk: 3 });

  // Illness count (0-2)
  const illnessCount = senior.illnesses?.length ?? 0;
  let illnessRisk = 0;
  if (illnessCount >= 2) illnessRisk = 2;
  else if (illnessCount === 1) illnessRisk = 1;
  factors.push({
    label: illnessCount === 0 ? "No illnesses" : `${illnessCount} illness${illnessCount > 1 ? "es" : ""}`,
    risk: illnessRisk,
    maxRisk: 2,
  });

  // Total: max possible = 3+4+2+3+2 = 14
  const score = healthRisk + incomeRisk + livingRisk + ageRisk + illnessRisk;

  let level: PriorityResult["level"];
  if (score >= 10) level = "High";
  else if (score >= 7) level = "Medium";
  else level = "Low";

  return { score, level, factors };
}

export function calculateAge(birthDate: string): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}
