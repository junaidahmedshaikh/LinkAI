import { useState } from "react";
import { WEB_APP_URL } from "@/utils/config";

type AuthMode = "login" | "register";

interface AuthPanelProps {
  loading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => Promise<boolean>;
  onRegister: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  compact?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

export function AuthPanel({
  loading,
  error,
  onLogin,
  onRegister,
  compact,
}: AuthPanelProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const resetForm = () => {
    setLocalError(null);
    setConfirmPassword("");
  };

  const switchMode = (next: AuthMode) => {
    setMode(next);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }
    if (!password) {
      setLocalError("Password is required");
      return;
    }

    if (mode === "register") {
      if (!fullName.trim() || fullName.trim().length < 2) {
        setLocalError("Name must be at least 2 characters");
        return;
      }
      if (password.length < 8) {
        setLocalError("Password must be at least 8 characters");
        return;
      }
      if (
        !/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)
      ) {
        setLocalError("Password must include upper, lower, and a number");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError("Passwords do not match");
        return;
      }
      await onRegister(fullName.trim(), email.trim(), password);
      return;
    }
    await onLogin(email.trim(), password);
  };

  const displayError = localError ?? error;

  return (
    <div className={compact ? "w-full" : "w-[360px] p-5"}>
      {!compact && (
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/20 text-accent font-bold text-lg">
            L
          </div>
          <h1 className="text-lg font-semibold">LinkAI</h1>
          <p className="text-xs text-muted-foreground mt-1">
            {mode === "login"
              ? "Sign in to your account"
              : "Create your account"}
          </p>
        </div>
      )}

      <div className="mb-4 flex rounded-lg border border-surface-border p-1">
        <button
          type="button"
          onClick={() => switchMode("login")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "login" ? "bg-accent text-white" : "text-muted-foreground"
          }`}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => switchMode("register")}
          className={`flex-1 rounded-md py-1.5 text-xs font-medium transition-colors ${
            mode === "register"
              ? "bg-accent text-white"
              : "text-muted-foreground"
          }`}
        >
          Sign up
        </button>
      </div>

      {displayError && (
        <p className="mb-3 text-xs text-red-400 text-center">{displayError}</p>
      )}

      <form
        onSubmit={async (e) => {
          await handleSubmit(e);
        }}
        className="space-y-3"
      >
        {mode === "register" && (
          <input
            type="text"
            placeholder="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            autoComplete="name"
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          autoComplete="email"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {mode === "register" && (
          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={inputClass}
            autoComplete="new-password"
          />
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-accent py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {loading
            ? "Please wait…"
            : mode === "login"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      {mode === "login" && (
        <a
          href={`${WEB_APP_URL}/forgot-password`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 block text-center text-xs text-accent"
        >
          Forgot password?
        </a>
      )}

      <p className="mt-4 text-center text-[11px] text-muted-foreground">
        Sessions sync automatically between the web app and extension.
      </p>
    </div>
  );
}
