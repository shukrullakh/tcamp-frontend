import { Navbar } from "./Navbar";
import { Link } from "wouter";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { lang } = useLang();
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-5xl animate-in fade-in duration-500">
        {children}
      </main>
      <footer className="border-t py-10 bg-background/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="space-y-3">
              <h3 className="font-bold text-lg">TCamp</h3>
              <p className="text-sm text-muted-foreground">
                {t(lang, "common.app.tagline")}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{t(lang, "common.footer.section")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/"><span className="hover:text-primary cursor-pointer">{t(lang, "home")}</span></Link></li>
                <li><Link href="/ask"><span className="hover:text-primary cursor-pointer">{t(lang, "askQuestion")}</span></Link></li>
                <li><Link href="/ask-ai"><span className="hover:text-primary cursor-pointer">{t(lang, "askAI")}</span></Link></li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-sm">{t(lang, "common.footer.legal")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/support"><span className="hover:text-primary cursor-pointer">{t(lang, "support")}</span></Link></li>
                <li><Link href="/privacy"><span className="hover:text-primary cursor-pointer">{t(lang, "privacy")}</span></Link></li>
                <li><Link href="/terms"><span className="hover:text-primary cursor-pointer">{t(lang, "terms")}</span></Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 text-center text-sm text-muted-foreground">
            <p>{t(lang, "common.footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
