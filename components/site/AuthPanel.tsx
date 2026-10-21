"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ComicButtonAsButton } from "@/components/ui/ComicButton";

/**
 * Email + password sign-in. Sign up logs the member in immediately instead
 * of emailing a verification code (requires "Confirm email" to be disabled
 * in the Supabase Auth settings — otherwise signUp won't return a session).
 */
export function AuthPanel({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    if (mode === "signup") {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setError("Account created, but email confirmation is still required. Check your inbox.");
        return;
      }
      onSignedIn();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    onSignedIn();
  }

  return (
    <form onSubmit={handleSubmit} className="comic-panel rounded-2xl bg-white p-8">
      <Lock className="mx-auto text-sky-blue" size={36} />
      <h2 className="font-display mt-2 text-center text-3xl text-comic-black">
        {mode === "signup" ? "Join My SKC" : "Sign in to My SKC"}
      </h2>
      <p className="mt-2 text-center text-sm text-comic-black/60">
        {mode === "signup"
          ? "Create an account with your email and a password."
          : "Enter your email and password to sign in."}
      </p>
      <div className="mt-6 space-y-4">
        <div className="relative">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-comic-black/40" size={18} />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 pl-11 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
        </div>
        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-comic-black/40" size={18} />
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="w-full rounded-xl border-2 border-comic-black px-4 py-3 pl-11 focus:ring-4 focus:ring-golden-orange/40 focus:outline-none"
          />
        </div>
        {error && <p className="text-sm font-semibold text-comic-red">{error}</p>}
        <ComicButtonAsButton type="submit" variant="blue" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : mode === "signup" ? (
            "Create account"
          ) : (
            "Sign in"
          )}
        </ComicButtonAsButton>
        <button
          type="button"
          onClick={() => {
            setMode(mode === "signup" ? "login" : "signup");
            setError(null);
          }}
          className="w-full text-center text-sm font-semibold text-comic-black/60 hover:text-comic-black"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </form>
  );
}
