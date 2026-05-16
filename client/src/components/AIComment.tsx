import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

interface AICommentProps {
  contextText: string;
  type?: "question" | "answer" | "reply";
}

export function AIComment({ contextText, type = "answer" }: AICommentProps) {
  const { lang } = useLang();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const getPrompt = () => {
    switch (type) {
      case "question":
        return `Quyidagi savolni tahlil qil va qisqa izoh ber (2-3 jumla): "${contextText}"`;
      case "answer":
        return `Quyidagi javobni baholа va qisqa izoh ber (2-3 jumla): "${contextText}"`;
      case "reply":
        return `Quyidagi replyni qisqacha tahlil qil (1-2 jumla): "${contextText}"`;
      default:
        return `Quyidagi matnni tahlil qil: "${contextText}"`;
    }
  };

  const handleToggle = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);

    if (!content) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch("/api/ai/chat/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            messages: [{ role: "user", content: getPrompt() }]
          })
        });
        const data = await res.json();
        const text = data.choices?.[0]?.message?.content || t(lang, "post.ai.analysisError");
        setContent(text);
      } catch {
        setContent(t(lang, "post.ai.commentError"));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="mt-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleToggle}
        className={cn(
          "cursor-pointer text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 text-xs font-medium h-8 px-2 gap-1.5 transition-all duration-300",
          isOpen && "bg-blue-50 dark:bg-blue-900/20"
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        {t(lang, "post.ai.comment")}
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {isOpen && (
        <div className="mt-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900 rounded-lg p-4 shadow-sm relative">
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Wand2 className="w-3 h-3 mr-1" />
                AI
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center space-x-2 py-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <span className="text-xs text-blue-500 ml-2 font-medium">{t(lang, "post.ai.analyzing")}</span>
              </div>
            ) : (
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pr-12">
                {content}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
