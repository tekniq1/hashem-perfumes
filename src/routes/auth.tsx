import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { LogoMark } from "@/components/brand/Logo";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — هاشم للطيب | Sign in" },
      {
        name: "description",
        content:
          "تسجيل الدخول أو إنشاء حساب جديد في متجر هاشم للطيب لمتابعة طلبات العطور والبخور الملكي.",
      },
      { property: "og:title", content: "تسجيل الدخول — هاشم للطيب" },
      { property: "og:description", content: "الوصول إلى حسابك في متجر هاشم للطيب." },
    ],
  }),
  component: AuthPage,
});

const field =
  "w-full rounded-xl border border-border bg-background/80 px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary";

function AuthPage() {
  const { t } = useI18n();
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error(t("auth_enter_email_password"));
      return;
    }

    setBusy(true);
    try {
      if (mode === "in") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        toast.success(t("auth_login_success"));
      } else {
        const { error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: fullName.trim(),
              phone: phone.trim(),
            },
          },
        });
        if (error) throw error;
        toast.success(t("auth_signup_success"));
      }
      router.navigate({ to: "/" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth_error"));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        if (
          error.message?.includes("missing OAuth client ID") ||
          (error as unknown as { code?: string })?.code === "validation_failed"
        ) {
          toast.error(t("auth_google_missing_id"));
        } else {
          toast.error(error.message || t("auth_google_error"));
        }
      }
    } catch (e) {
      toast.error(t("auth_google_connect_error"));
    } finally {
      setGoogleBusy(false);
    }
  };

  const handleSignOut = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
      toast.success(t("auth_signout_success"));
    } catch (e) {
      toast.error(t("auth_signout_error"));
    } finally {
      setBusy(false);
    }
  };

  // If user is already logged in, show account info and quick navigation
  if (!authLoading && user) {
    return (
      <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
        <div className="glass rounded-3xl p-8 text-center border border-border shadow-gold-glow space-y-5">
          <div className="flex justify-center">
            <CheckCircle2 className="size-14 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-foreground">
              {t("already_signed_in")}
            </h1>
            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
            {profile?.full_name ? (
              <p className="text-xs font-semibold text-primary mt-1">
                {t("welcome_user")}، {profile.full_name}
              </p>
            ) : null}
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to="/"
              className="w-full rounded-xl bg-gold-gradient py-3 text-xs font-bold text-primary-foreground shadow-gold-glow"
            >
              {t("go_home")}
            </Link>
            {profile?.role === "admin" ? (
              <Link
                to="/admin"
                className="w-full rounded-xl border border-primary/40 bg-primary/10 py-3 text-xs font-bold text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                {t("admin_panel")}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={handleSignOut}
              disabled={busy}
              className="flex items-center justify-center gap-2 text-xs text-destructive hover:underline pt-2 cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>{t("sign_out_account")}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-16 sm:px-6">
      <div className="glass rounded-3xl p-8 shadow-gold-glow border border-border/80">
        <div className="flex flex-col items-center text-center mb-6">
          <LogoMark size={56} />
          <h1 className="font-display text-xl font-bold text-gold-gradient mt-3">{t("brand")}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t("tagline")}</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 rounded-xl bg-secondary/80 p-1 mb-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMode("in")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === "in"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground"
            }`}
          >
            {t("sign_in")}
          </button>
          <button
            type="button"
            onClick={() => setMode("up")}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              mode === "up"
                ? "bg-background text-foreground shadow-xs font-bold"
                : "text-muted-foreground"
            }`}
          >
            {t("sign_up")}
          </button>
        </div>

        {/* Google Sign-in */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleBusy}
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-border bg-background/80 py-3 text-xs font-semibold text-foreground hover:bg-accent transition-all cursor-pointer shadow-xs disabled:opacity-50"
        >
          {googleBusy ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <svg className="size-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>{t("continue_with_google")}</span>
        </button>

        <div className="relative my-6 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border" />
          </div>
          <span className="relative bg-card px-3 text-[11px] text-muted-foreground">
            {t("or_with_email")}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {mode === "up" ? (
            <>
              <div>
                <label
                  htmlFor="auth-name"
                  className="text-[11px] font-medium text-muted-foreground block mb-1"
                >
                  {t("full_name")}
                </label>
                <input
                  id="auth-name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={field}
                  placeholder={t("name_placeholder")}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="auth-tel"
                  className="text-[11px] font-medium text-muted-foreground block mb-1"
                >
                  {t("phone")}
                </label>
                <input
                  id="auth-tel"
                  name="tel"
                  type="tel"
                  autoComplete="tel"
                  className={field}
                  dir="ltr"
                  placeholder="96877036097"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </>
          ) : null}

          <div>
            <label
              htmlFor="auth-email-input"
              className="text-[11px] font-medium text-muted-foreground block mb-1"
            >
              {t("email")}
            </label>
            <input
              id="auth-email-input"
              name="email"
              type="email"
              autoComplete={mode === "in" ? "username" : "email"}
              spellCheck={false}
              className={field}
              dir="ltr"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label
              htmlFor="auth-pwd-input"
              className="text-[11px] font-medium text-muted-foreground block mb-1"
            >
              {t("password")}
            </label>
            <input
              id="auth-pwd-input"
              name="password"
              type="password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              className={field}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl bg-gold-gradient py-3 text-xs font-bold text-primary-foreground shadow-gold-glow disabled:opacity-50 cursor-pointer mt-2 hover:opacity-95 transition-opacity"
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin mx-auto" />
            ) : mode === "in" ? (
              t("sign_in")
            ) : (
              t("sign_up")
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
