import { Check, Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLang } from "@/components/LanguageContext";
import { languages, t, type Language } from "@/i18n";
import { cn } from "@/lib/utils";

const languageCodes = Object.keys(languages) as Language[];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { lang, setLang } = useLang();
  const current = languages[lang];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className={cn("gap-2 whitespace-nowrap cursor-pointer", compact && "h-9 w-9")}
          aria-label={t(lang, "common.language.switcher")}
        >
          <Languages className="h-4 w-4" />
          {!compact && <span>{current.shortName}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>{t(lang, "common.language.select")}</DropdownMenuLabel>
        {languageCodes.map((code) => (
          <DropdownMenuItem
            key={code}
            className="cursor-pointer justify-between"
            onClick={() => setLang(code)}
          >
            <span className="flex items-center gap-2">
              <span aria-hidden>{languages[code].flag}</span>
              {languages[code].nativeName}
            </span>
            {code === lang && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
