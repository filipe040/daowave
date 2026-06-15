import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const RegisterSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Password deve ter pelo menos 6 caracteres"),
  brandName: z.string().min(1, "Nome da marca é obrigatório"),
  vatNumber: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Já existe um utilizador com este email" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user and promoter profile
    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        role: "USER",
        promoterProfile: {
          create: {
            brandName: data.brandName,
            vatNumber: data.vatNumber || null,
            status: "PENDING", // Admin can approve later
          },
        },
      },
      include: {
        promoterProfile: true,
      },
    });

    return NextResponse.json({
      success: true,
      promoter: user.promoterProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error registering promoter:", error);
    return NextResponse.json(
      { error: "Failed to register promoter" },
      { status: 500 }
    );
  }
}

