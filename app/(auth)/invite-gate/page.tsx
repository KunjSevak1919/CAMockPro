"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function InviteGatePage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true); // checking access on mount
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // On mount: check if the user already has access (returning user)
  useEffect(() => {
    async function checkAccess() {
      try {
        const res = await fetch("/api/auth/check-access");
        const data = await res.json();
        if (data.hasAccess) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        // Network error — fall through and show the form
      }
      setChecking(false);
    }

    checkAccess();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/validate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (data.valid) {
        router.push("/dashboard");
      } else {
        setError(data.message ?? "Invalid invite code. Please try again.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  // Show spinner while checking access
  if (checking) {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <p className="text-sm">Checking access…</p>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-2">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-base">
              CA
            </span>
          </div>
          <span className="text-2xl font-bold tracking-tight">MockCA.ai</span>
        </div>
        <CardTitle className="text-xl">Enter your access code</CardTitle>
        <CardDescription>
          MockCA.ai is in private beta. Enter your invite code to continue.
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="invite-code">Invite code</Label>
            <Input
              id="invite-code"
              placeholder="MOCKCA-BETA-XXXX"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="uppercase tracking-widest font-mono"
              required
              disabled={loading}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm text-destructive font-medium">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading || !code}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying…
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Don&apos;t have a code?{" "}
          <a
            href="mailto:hello@mockca.ai"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Request access
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
