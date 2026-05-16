import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

interface SaveButtonProps {
  entityId: string;
  type?: "question" | "answer" | "reply";
  initialSaved?: boolean;
}

export function SaveButton({ entityId }: SaveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { lang } = useLang();

  const { data: savedData } = useQuery<any>({
    queryKey: ["/api/saved/ids"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/saved/?ids_only=true");
      return res.json();
    },
    enabled: !!getAccessToken(),
    staleTime: 0,
  });

  const saved = (savedData?.ids || []).map(Number).includes(Number(entityId));

  const handleSave = async () => {
    if (!getAccessToken()) { navigate("/login"); return; }
    setLoading(true);
    try {
      await apiRequest("POST", "/api/saved/", { question_id: Number(entityId) });
      qc.invalidateQueries({ queryKey: ["/api/saved/ids"] });
      qc.invalidateQueries({ queryKey: ["/api/saved"] });
    } catch {
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleSave}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 h-8 px-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors",
        saved && "text-amber-600 bg-amber-50 dark:bg-amber-950/30"
      )}
    >
      <Bookmark className={cn("w-4 h-4 transition-transform", saved && "fill-current")} />
      <span className="text-xs font-medium">{saved ? t(lang, "post.actions.saved") : t(lang, "post.actions.save")}</span>
    </Button>
  );
}
