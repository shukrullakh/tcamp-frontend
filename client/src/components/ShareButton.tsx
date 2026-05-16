import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

interface ShareButtonProps {
  entityId: string | number;
  title?: string;
  type?: "question" | "answer" | "reply";
}

export function ShareButton({ entityId, title, type = "question" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const { lang } = useLang();

  const handleShare = async () => {
    const url = `${window.location.origin}/${type}/${entityId}`;
    
    if (navigator.share) {
      // Native share API
      try {
        await navigator.share({
          title: title || t(lang, "post.actions.share"),
          url,
        });
      } catch (err) {
        console.error("Share error:", err);
      }
    } else {
      // Copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast({ title: t(lang, "post.toast.linkCopied") });
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast({ title: t(lang, "common.errors.copyFailed"), variant: "destructive" });
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleShare}
      className="flex items-center gap-1.5 h-8 px-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition-colors"
    >
      {copied ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <Share2 className="w-4 h-4" />
      )}
      <span className="text-xs font-medium">{t(lang, "post.actions.share")}</span>
    </Button>
  );
}
