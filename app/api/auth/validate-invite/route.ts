import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    // Auth check — every API route must do this first
    await getAuthUser();
  } catch (err) {
    return err as Response;
  }

  let code: string;
  try {
    const body = await request.json();
    code = (body.code ?? "").trim().toUpperCase();
  } catch {
    return NextResponse.json(
      { valid: false, message: "Invalid request body." },
      { status: 400 }
    );
  }

  if (!code) {
    return NextResponse.json(
      { valid: false, message: "Invite code is required." },
      { status: 400 }
    );
  }

  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code },
  });

  if (!inviteCode) {
    return NextResponse.json({
      valid: false,
      message: "Invite code not found.",
    });
  }

  if (!inviteCode.isActive) {
    return NextResponse.json({
      valid: false,
      message: "This invite code has been deactivated.",
    });
  }

  if (inviteCode.expiresAt && inviteCode.expiresAt < new Date()) {
    return NextResponse.json({
      valid: false,
      message: "This invite code has expired.",
    });
  }

  if (inviteCode.useCount >= inviteCode.maxUses) {
    return NextResponse.json({
      valid: false,
      message: "This invite code has already been used.",
    });
  }

  // Valid — consume one use
  await prisma.inviteCode.update({
    where: { id: inviteCode.id },
    data: { useCount: { increment: 1 } },
  });

  return NextResponse.json({ valid: true });
}
