import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, MessageSquareQuote, Repeat2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

interface RepostButtonProps {
  entityId: string;
  type?: "question" | "answer" | "reply";
  reposted?: boolean;
  count?: number;
  onToggleRepost?: (reposted: boolean) => void;
}

export function RepostButton({ entityId, type = "question", reposted = false, count = 0, onToggleRepost }: RepostButtonProps) {
  const [isReposted, setIsReposted] = useState(reposted);
  const [repostCount, setRepostCount] = useState(count);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteText, setQuoteText] = useState("");
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { lang } = useLang();

  useEffect(() => {
    const stored = localStorage.getItem(`reposted_${type}_${entityId}`) === "true";
    setIsReposted(reposted || stored);
    setRepostCount(count);
  }, [count, entityId, reposted, type]);

  const mutation = useMutation({
    mutationFn: async (payload: { quote_text?: string }) => {
      const res = await apiRequest("POST", "/api/reposts/", {
        question_id: Number(entityId),
        quote_text: payload.quote_text || "",
      });
      return res.json() as Promise<{ reposted: boolean; quote_text?: string; reposts_count: number }>;
    },
    onMutate: async (payload) => {
      const next = payload.quote_text ? true : !isReposted;
      setIsReposted(next);
      setRepostCount((value) => Math.max(0, value + (next ? 1 : -1)));
      localStorage.setItem(`reposted_${type}_${entityId}`, String(next));
      onToggleRepost?.(next);
    },
    onSuccess: (data) => {
      setIsReposted(data.reposted);
      setRepostCount(data.reposts_count);
      localStorage.setItem(`reposted_${type}_${entityId}`, String(data.reposted));
      setQuoteOpen(false);
      setQuoteText("");
      toast({ title: data.reposted ? (data.quote_text ? t(lang, "post.repost.quoteDone") : t(lang, "post.repost.done")) : t(lang, "post.repost.removed") });
    },
    onError: () => {
      setIsReposted((value) => !value);
      toast({ title: t(lang, "post.repost.error"), variant: "destructive" });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["/api/questions"] });
      qc.invalidateQueries({ queryKey: ["/api/reposts"] });
    },
  });

  const requireAuth = () => {
    if (getAccessToken()) return true;
    navigate("/login");
    return false;
  };

  const simpleRepost = () => {
    if (!requireAuth()) return;
    mutation.mutate({});
  };

  const quoteRepost = () => {
    if (!requireAuth() || !quoteText.trim()) return;
    mutation.mutate({ quote_text: quoteText.trim() });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={mutation.isPending}
            className={cn(
              "h-8 gap-1.5 rounded-full px-2 text-muted-foreground transition hover:bg-emerald-500/10 hover:text-emerald-600",
              isReposted && "bg-emerald-500/10 text-emerald-600",
            )}
            aria-label={t(lang, "post.actions.repost")}
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <motion.span animate={isReposted ? { rotate: 360, scale: [1, 1.18, 1] } : { rotate: 0 }} transition={{ duration: 0.35 }}>
                <Repeat2 className="h-4 w-4" />
              </motion.span>
            )}
            <span className="text-xs font-medium">{repostCount || t(lang, "post.actions.repost")}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 rounded-xl">
          <DropdownMenuItem onClick={simpleRepost} className="cursor-pointer">
            <Repeat2 className="mr-2 h-4 w-4" />
            {isReposted ? t(lang, "post.actions.undoRepost") : t(lang, "post.actions.repost")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => (requireAuth() ? setQuoteOpen(true) : undefined)} className="cursor-pointer">
            <MessageSquareQuote className="mr-2 h-4 w-4" />
            {t(lang, "post.actions.quoteRepost")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={quoteOpen} onOpenChange={setQuoteOpen}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t(lang, "post.actions.quoteRepost")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={quoteText}
            onChange={(event) => setQuoteText(event.target.value)}
            placeholder={t(lang, "post.repost.quotePlaceholder")}
            className="min-h-28 resize-none rounded-xl"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" className="rounded-full" onClick={() => setQuoteOpen(false)}>{t(lang, "cancel")}</Button>
            <Button className="rounded-full" disabled={mutation.isPending || !quoteText.trim()} onClick={quoteRepost}>
              {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {t(lang, "post.actions.repost")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
