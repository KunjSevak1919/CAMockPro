import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

// GET /api/auth/check-access
// Called by the invite-gate page on mount to check if the user
// has already used an invite code (and thus can skip the gate).
export async function GET() {
  try {
    const user = await getAuthUser();
    const hasAccess = user.inviteCodeUsed !== null;
    return NextResponse.json({ hasAccess });
  } catch {
    // Not authenticated or any other error — no access
    return NextResponse.json({ hasAccess: false });
  }
}
