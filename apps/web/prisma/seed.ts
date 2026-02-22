import {
  PrismaClient,
  MemberRole,
  EventStatus,
  TicketStatus,
  OrganizationStatus,
  TicketTemplateStatus,
  TicketTemplateLayout,
  Role,
  OrganizerStatus
} from "@prisma/client";
// Triggering IDE refresh for Prisma types
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
      role: Role.ADMIN,
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
      role: Role.PROMOTER,
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
      role: Role.PROMOTER,
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
      status: OrganizerStatus.APPROVED,
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
  const event = await prisma.event.upsert({
    where: { slug: "sr-opening-2025" },
    update: {},
    create: {
      organizationId: soundRepublic.id,
      promoterId: profile.id,
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
  console.log(`✅ Evento criado: ${event.title} `);

  // 7. Create Ticket Templates for Sound Republic
  console.log("🎨 A criar templates de bilhetes...");
  const activeTemplate = await prisma.organizationTicketTemplate.create({
    data: {
      organizationId: soundRepublic.id,
      name: "Classic Sound Republic",
      status: TicketTemplateStatus.ACTIVE,
      layout: TicketTemplateLayout.A4_CLASSIC,
      version: 1,
      themeJson: {
        brand: { logoUrl: "", tagline: "Sound Republic - Feel the Rhythm" },
        colors: {
          bg: "#ffffff",
          card: "#ffffff",
          text: "#111111",
          primary: "#1982c4",
          muted: "#666666",
        },
        typography: { fontFamily: "Inter" },
        qr: { size: "M", label: "Validar na entrada" },
        blocks: {
          showBuyerName: true,
          showOrderId: true,
          showTicketType: true,
          showTerms: true,
          showSupport: true,
        },
        footer: { supportUrl: "https://soundrepublic.pt", supportEmail: "ajuda@soundrepublic.pt" },
      },
    },
  });

  await prisma.organizationTicketTemplate.create({
    data: {
      organizationId: soundRepublic.id,
      name: "Draft Horizontal",
      status: TicketTemplateStatus.DRAFT,
      layout: TicketTemplateLayout.HORIZONTAL_QR_RIGHT,
      version: 1,
      themeJson: {
        brand: { logoUrl: "", tagline: "" },
        colors: {
          bg: "#f8f9fa",
          card: "#ffffff",
          text: "#212529",
          primary: "#6a4c93",
          muted: "#6c757d",
        },
        typography: { fontFamily: "Poppins" },
        qr: { size: "L", label: "Scanner below" },
        blocks: {
          showBuyerName: true,
          showOrderId: false,
          showTicketType: true,
          showTerms: true,
          showSupport: false,
        },
        footer: { supportUrl: "", supportEmail: "" },
      },
    },
  });

  console.log(`✅ Templates de bilhetes criados.Ativo: ${activeTemplate.name} `);
  console.log(`\n📧 Credenciais: `);
  console.log(`  Admin: admin @daowave.pt / password123`);
  console.log(`  Owner: owner@soundrepublic.pt / password123`);
  console.log(`  Manager: manager@soundrepublic.pt / password123`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
