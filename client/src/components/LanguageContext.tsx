import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { defaultLanguage, isLanguage, Language } from "@/i18n";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
}

const STORAGE_KEY = "talaba-ui-language";

const LanguageContext = createContext<LanguageContextType>({ lang: defaultLanguage, setLang: () => {} });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) || localStorage.getItem("lang");
    return isLanguage(stored) ? stored : defaultLanguage;
  });

  const setLang = (l: Language) => {
    localStorage.setItem(STORAGE_KEY, l);
    localStorage.setItem("lang", l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = "ltr";
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLang = () => useContext(LanguageContext);
