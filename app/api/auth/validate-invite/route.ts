import { NextResponse } from "next/server";
import { createSupabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/prisma";

// POST /api/auth/validate-invite
// Uses Bearer token auth (Authorization: Bearer <jwt>) so we don't rely on
// cookies inside a POST request — the invite-gate page sends the token
// explicitly after reading it from the browser Supabase client.

export async function POST(request: Request) {
  // ── Identify the user via Bearer token ──────────────────────────────────
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return NextResponse.json(
      { valid: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  const supabase = createSupabaseAdmin();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  console.log("validate-invite — getUser error:", userError?.message ?? "none");
  console.log("validate-invite — user email:", user?.email);

  if (userError || !user) {
    return NextResponse.json(
      { valid: false, message: "Unauthorized." },
      { status: 401 }
    );
  }

  // ── Parse invite code ────────────────────────────────────────────────────
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

  // ── Validate invite code ─────────────────────────────────────────────────
  const inviteCode = await prisma.inviteCode.findUnique({ where: { code } });

  if (!inviteCode) {
    return NextResponse.json({ valid: false, message: "Invite code not found." });
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

  // ── Save inviteCodeUsed + increment useCount ─────────────────────────────
  await Promise.all([
    prisma.user.upsert({
      where: { email: user.email! },
      update: { inviteCodeUsed: code },
      create: {
        id: user.id,
        email: user.email!,
        name:
          (user.user_metadata?.full_name as string | undefined) ??
          user.email!.split("@")[0],
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
        examLevel: "intermediate",
        inviteCodeUsed: code,
      },
    }),
    prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { useCount: { increment: 1 } },
    }),
  ]);

  console.log("User updated with inviteCodeUsed:", code);

  return NextResponse.json({ valid: true });
}
