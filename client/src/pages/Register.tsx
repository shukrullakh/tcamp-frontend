import { useState } from "react";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useLocation } from "wouter";

export function Register() {
  const { register } = useAuth();
  const [, navigate] = useLocation();
  const [form, setForm] = useState({
    username: "", email: "", password: "", first_name: "", last_name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { lang } = useLang();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register(form);
      navigate("/login");
    } catch {
      setError(t(lang, "auth.registerError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl border bg-card shadow-sm space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-bold">{t(lang, 'registerTitle')}</h1>
          <p className="text-sm text-muted-foreground">{t(lang, "registerDesc")}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t(lang, "firstNameLabel")}</label>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                placeholder={t(lang, "auth.placeholders.firstName")}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium">{t(lang, "lastNameLabel")}</label>
              <input
                className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                placeholder={t(lang, "auth.placeholders.lastName")}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">{t(lang, "auth.username")}</label>
            <input
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder={t(lang, "auth.placeholders.username")}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-medium">{t(lang, "auth.email")}</label>
            <input
              type="email"
              className="w-full border rounded-lg px-3 py-2 bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder={t(lang, "auth.placeholders.email")}
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
            {loading ? t(lang, 'loading') : t(lang, 'registerTitle')}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {t(lang, "hasAccount")}{" "}
          <Link href="/login">
            <span className="text-primary hover:underline cursor-pointer font-medium">{t(lang, "login")}</span>
          </Link>
        </p>
      </div>
    </div>
  );
}
