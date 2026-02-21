import { PrismaClient, MemberRole, EventStatus, TicketStatus, OrganizationStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}
function addHours(d: Date, hours: number) {
  const r = new Date(d);
  r.setHours(r.getHours() + hours);
  return r;
}

async function main() {
  console.log("🌱 A fazer seed da base de dados (V3 - Organizations Flow)...");
  const now = new Date();
  const pw = await hash("password123", 10);

  // 1. Create ADMIN
  const admin = await prisma.user.upsert({
    where: { email: "admin@daowave.pt" },
    update: {},
    create: {
      email: "admin@daowave.pt",
      name: "Super Admin",
      passwordHash: pw,
      role: "ADMIN",
      emailVerified: true,
      onboardingComplete: true
    },
  });

  // 2. Create Organizations
  const mainOrg = await prisma.organization.upsert({
    where: { slug: "daowave" },
    update: {},
    create: {
      name: "DAOwave Master",
      legalName: "DAOwave Technologies Lda",
      slug: "daowave",
      vatNumber: "PT500123456",
      status: OrganizationStatus.ACTIVE,
      contactEmail: "admin@daowave.pt",
      members: {
        create: {
          userId: admin.id,
          role: MemberRole.PROMOTER_OWNER,
          status: "ACTIVE"
        }
      }
    }
  });

  const soundRepublic = await prisma.organization.upsert({
    where: { slug: "sound-republic" },
    update: {},
    create: {
      name: "Sound Republic",
      legalName: "Republic of Sound Entertainment",
      slug: "sound-republic",
      vatNumber: "PT599888777",
      status: OrganizationStatus.ACTIVE,
      contactEmail: "booking@soundrepublic.pt",
      website: "https://soundrepublic.pt",
    }
  });

  // 3. Create Promoter Users
  const owner = await prisma.user.upsert({
    where: { email: "owner@soundrepublic.pt" },
    update: {},
    create: {
      email: "owner@soundrepublic.pt",
      name: "Ricardo Owner",
      passwordHash: pw,
      role: "PROMOTER",
      emailVerified: true,
      onboardingComplete: true
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@soundrepublic.pt" },
    update: {},
    create: {
      email: "manager@soundrepublic.pt",
      name: "Sérgio Manager",
      passwordHash: pw,
      role: "PROMOTER",
      emailVerified: true,
      onboardingComplete: true
    },
  });

  // 4. Create Promoter Profile (Legacy compatibility)
  const profile = await prisma.promoterProfile.upsert({
    where: { userId: owner.id },
    update: {},
    create: {
      userId: owner.id,
      brandName: "Sound Republic",
      status: "APPROVED",
      contactEmail: "booking@soundrepublic.pt"
    },
  });

  // 5. Assign Members to Sound Republic
  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: soundRepublic.id, userId: owner.id } },
    update: {},
    create: { organizationId: soundRepublic.id, userId: owner.id, role: MemberRole.PROMOTER_OWNER, status: "ACTIVE" }
  });

  await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: soundRepublic.id, userId: manager.id } },
    update: {},
    create: { organizationId: soundRepublic.id, userId: manager.id, role: MemberRole.PROMOTER_MANAGER, status: "ACTIVE" }
  });

  // 6. Create Events for Sound Republic
  const event = await prisma.event.create({
    data: {
      organizationId: soundRepublic.id,
      promoterId: profile.id, // Corrected: Use profile.id instead of owner.id
      title: "Sound Republic Opening Night",
      slug: "sr-opening-2025",
      description: "A grande abertura da temporada.",
      venue: "Lisbon Warehouse",
      city: "Lisboa",
      startAt: addDays(now, 30),
      endAt: addHours(addDays(now, 30), 8),
      status: EventStatus.PUBLISHED,
      coverImage: "https://picsum.photos/seed/opening/800/450",
    }
  });

  console.log(`✅ Organizações e membros criados.`);
  console.log(`✅ Evento criado: ${event.title}`);
  console.log(`\n📧 Credenciais:`);
  console.log(`  Admin: admin@daowave.pt / password123`);
  console.log(`  Owner: owner@soundrepublic.pt / password123`);
  console.log(`  Manager: manager@soundrepublic.pt / password123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
