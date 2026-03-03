import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FIXED_MEDICINES = [
  "Paracetamol 250 MG Tablet",
  "Paracetamol 500 MG Tablet",
  "Paracetamol 650 MG Tablet",
  "Azithromycin 250 MG Capsule",
  "Azithromycin 500 MG Tablet",
  "Vifol Tablet",
  "Crocin 650 MG Tablet",
  "Augmentin 625 MG Tablet",
  "Amoxicillin 500 MG Capsule",
  "Ibuprofen 400 MG Tablet",
];

const BASE_MEDICINES = [
  "Paracetamol",
  "Azithromycin",
  "Amoxicillin",
  "Ibuprofen",
  "Cefixime",
  "Cefpodoxime",
  "Levofloxacin",
  "Doxycycline",
  "Metformin",
  "Amlodipine",
  "Telmisartan",
  "Losartan",
  "Atorvastatin",
  "Rosuvastatin",
  "Pantoprazole",
  "Omeprazole",
  "Cetirizine",
  "Levocetirizine",
];

const STRENGTH_AND_FORMS = [
  "100 MG Tablet",
  "200 MG Tablet",
  "250 MG Tablet",
  "500 MG Tablet",
  "650 MG Tablet",
  "250 MG Capsule",
  "500 MG Capsule",
  "625 MG Tablet",
];

function buildMedicineNames(): string[] {
  const generated = BASE_MEDICINES.flatMap((medicine) =>
    STRENGTH_AND_FORMS.map((strength) => `${medicine} ${strength}`),
  );

  // Use Set to keep names unique while preserving insertion order.
  return Array.from(new Set([...FIXED_MEDICINES, ...generated]));
}

async function main() {
  const medicineNames = buildMedicineNames();

  for (const name of medicineNames) {
    await prisma.medicineMaster.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`MedicineMaster seed complete. Upserted ${medicineNames.length} medicine names.`);
}

main()
  .catch((error) => {
    console.error("MedicineMaster seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
