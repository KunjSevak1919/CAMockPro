import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import NavLink from "@/components/dashboard/NavLink";
import SignOutButton from "@/components/dashboard/SignOutButton";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect("/login");

  const email = session.user.email ?? "";
  const name =
    session.user.user_metadata?.full_name ??
    email.split("@")[0] ??
    "Student";

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ─────────────────────────────── */}
      <aside className="w-60 shrink-0 flex flex-col border-r bg-card">
        {/* Logo */}
        <div className="px-4 py-5">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <span className="text-primary-foreground font-bold text-xs">
                CA
              </span>
            </div>
            <span className="font-bold text-base tracking-tight">
              MockCA.ai
            </span>
          </Link>
        </div>

        <Separator />

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard">
            Dashboard
          </NavLink>
          <NavLink href="/history">
            History
          </NavLink>
          <NavLink href="/profile">
            Profile
          </NavLink>
        </nav>

        <Separator />

        {/* User + sign out */}
        <div className="px-3 py-4 space-y-2">
          <div className="px-3">
            <p className="text-xs font-medium text-foreground truncate">
              {name}
            </p>
            <p className="text-xs text-muted-foreground truncate">{email}</p>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main content ─────────────────────────── */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
