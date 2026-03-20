import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  // Get the Supabase session to identify the user
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) {
    return NextResponse.json({ valid: false, message: "Unauthorized." }, { status: 401 });
  }

  const authUser = session.user;

  // Parse invite code from body
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

  // Validate invite code
  const inviteCode = await prisma.inviteCode.findUnique({
    where: { code },
  });

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

  // Valid — save inviteCodeUsed on user and increment useCount atomically
  await Promise.all([
    prisma.user.upsert({
      where: { email: authUser.email! },
      update: { inviteCodeUsed: code },
      create: {
        id: authUser.id,
        email: authUser.email!,
        name:
          authUser.user_metadata?.full_name ??
          authUser.email!.split("@")[0],
        avatarUrl: authUser.user_metadata?.avatar_url ?? null,
        examLevel: "intermediate",
        inviteCodeUsed: code,
      },
    }),
    prisma.inviteCode.update({
      where: { id: inviteCode.id },
      data: { useCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.json({ valid: true });
}
