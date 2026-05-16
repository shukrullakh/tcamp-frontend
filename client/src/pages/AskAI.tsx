import { AIChat } from "@/components/AIChat";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

export function AskAI() {
  const { lang } = useLang();
  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold text-foreground">{t(lang, "post.ai.assistantTitle")}</h1>
        <p className="text-muted-foreground">
          {t(lang, "post.ai.assistantDescription")}
        </p>
      </div>
      
      <AIChat />
    </div>
  );
}
