import { useState } from "react";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";

export function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email_or_username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { lang } = useLang();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(form.email_or_username, form.password);
      window.location.href = "/";
    } catch {
      setError(t(lang, "auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{t(lang, "loginTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t(lang, "loginDesc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-sm font-medium">{t(lang, "usernameOrEmail")}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.email_or_username}
              onChange={(e) => setForm({ ...form, email_or_username: e.target.value })}
              placeholder={t(lang, "auth.placeholders.usernameOrEmail")}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">{t(lang, "password")}</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border rounded-lg px-3 py-2 pr-10 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t(lang, "common.a11y.hidePassword") : t(lang, "common.a11y.showPassword")}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? t(lang, "loading") : t(lang, "login")}
          </button>
        </form>
          
        <p className="text-center text-sm text-muted-foreground">
          {t(lang, "noAccount")}{" "}
          <Link href="/register">
            <span className="text-primary hover:underline cursor-pointer font-medium">{t(lang, 'register')}</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
