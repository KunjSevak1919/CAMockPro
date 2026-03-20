"use client";

import { useState } from "react";
import { createBrowserClient } from "@supabase/auth-helpers-nextjs";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// ── Google icon ───────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// ── Divider ───────────────────────────────────────────────

function Divider() {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <span className="w-full border-t" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-card px-2 text-muted-foreground">or</span>
      </div>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────

export default function LoginPage() {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const callbackUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth/callback`
      : "/api/auth/callback";

  // ── Shared state ───────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);

  // ── Sign In state ──────────────────────────────────────
  const [signInEmail, setSignInEmail] = useState("");
  const [signInError, setSignInError] = useState<string | null>(null);
  const [signInSuccess, setSignInSuccess] = useState<string | null>(null);

  // ── Sign Up state ──────────────────────────────────────
  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpError, setSignUpError] = useState<string | null>(null);
  const [signUpSuccess, setSignUpSuccess] = useState<string | null>(null);

  // ── Tab switch helpers ─────────────────────────────────
  function switchTab(tab: "signin" | "signup") {
    setActiveTab(tab);
    setSignInError(null);
    setSignInSuccess(null);
    setSignUpError(null);
    setSignUpSuccess(null);
  }

  // ── Google OAuth ───────────────────────────────────────
  async function handleGoogleSignIn() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (error) {
      setSignInError(error.message);
      setSignUpError(error.message);
      setLoading(false);
    }
    // On success Supabase redirects — no setLoading(false) needed
  }

  // ── Sign In — magic link ───────────────────────────────
  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!signInEmail) return;
    setLoading(true);
    setSignInError(null);
    setSignInSuccess(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: signInEmail,
      options: { emailRedirectTo: callbackUrl },
    });

    if (error) {
      setSignInError(error.message);
    } else {
      setSignInSuccess("Magic link sent! Check your inbox.");
    }
    setLoading(false);
  }

  // ── Sign Up — magic link + name ────────────────────────
  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) {
      setSignUpError("Name required.");
      return;
    }
    setLoading(true);
    setSignUpError(null);
    setSignUpSuccess(null);

    const { error } = await supabase.auth.signInWithOtp({
      email: signUpEmail,
      options: {
        emailRedirectTo: callbackUrl,
        data: { full_name: fullName.trim() },
      },
    });

    if (error) {
      setSignUpError(error.message);
    } else {
      setSignUpSuccess(
        "Account created! Check your email for the magic link."
      );
    }
    setLoading(false);
  }

  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader className="text-center space-y-1 pb-3">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-base">
              CA
            </span>
          </div>
          <span className="text-2xl font-bold tracking-tight">MockCA.ai</span>
        </div>
        <CardDescription className="text-sm text-gray-500">
          India&apos;s First AI Mock Interview Platform for CA Students
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-2">
        <Tabs
          value={activeTab}
          onValueChange={(v) => switchTab(v as "signin" | "signup")}
        >
          <TabsList className="grid w-full grid-cols-2 mb-5">
            <TabsTrigger value="signin">Sign In</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>

          {/* ── Sign In tab ─────────────────────────────── */}
          <TabsContent value="signin" className="space-y-4">
            <div>
              <CardTitle className="text-lg">Welcome back</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sign in to continue your practice
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <GoogleIcon />
              Continue with Google
            </Button>

            <Divider />

            <form onSubmit={handleSignIn} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signin-email">Email address</Label>
                <Input
                  id="signin-email"
                  type="email"
                  placeholder="Enter your email"
                  value={signInEmail}
                  onChange={(e) => setSignInEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {signInError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {signInError}
                </div>
              )}
              {signInSuccess && (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  {signInSuccess}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || !signInEmail}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Send Sign In Link
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-2 hover:opacity-80"
                onClick={() => switchTab("signup")}
              >
                Sign up
              </button>
            </p>
          </TabsContent>

          {/* ── Sign Up tab ─────────────────────────────── */}
          <TabsContent value="signup" className="space-y-4">
            <div>
              <CardTitle className="text-lg">Create your account</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Start your CA interview preparation
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <GoogleIcon />
              Sign up with Google
            </Button>

            <Divider />

            <form onSubmit={handleSignUp} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="signup-email">Email address</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="Your email address"
                  value={signUpEmail}
                  onChange={(e) => setSignUpEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              {signUpError && (
                <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
                  {signUpError}
                </div>
              )}
              {signUpSuccess && (
                <div className="rounded-md bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
                  {signUpSuccess}
                </div>
              )}

              <Button
                type="submit"
                className="w-full gap-2"
                disabled={loading || !signUpEmail || !fullName}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <button
                type="button"
                className="text-primary underline underline-offset-2 hover:opacity-80"
                onClick={() => switchTab("signin")}
              >
                Sign in
              </button>
            </p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
