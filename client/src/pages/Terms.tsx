import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

export function Terms() {
  const { lang } = useLang();

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 animate-in fade-in duration-500">
      <header>
        <h1 className="mb-2 text-3xl font-bold">{t(lang, "common.footer.terms")}</h1>
        <p className="text-muted-foreground">{t(lang, "common.footer.lastUpdated")}</p>
      </header>
      <section className="rounded-xl border bg-card p-5 text-sm leading-7 text-muted-foreground">
        {t(lang, "common.footer.termsDescription")}
      </section>
    </div>
  );
}
