import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QuestionCard } from "@/components/QuestionCard";
import { AIComment } from "@/components/AIComment";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { useLang } from "@/components/LanguageContext";
import { formatRelativeTime, t } from "@/i18n";
import { LikeButton } from "@/components/LikeButton";
import { AuthorInfo } from "@/components/AuthorInfo";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useState } from "react";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { getMediaUrl } from "@/lib/media";

function Avatar({ user, size = "md" }: { user: any, size?: "sm" | "md" }) {

  const s = size === "sm"
    ? "w-8 h-8 text-xs"
    : "w-10 h-10 text-sm";

  const avatar =
    user?.avatar ||
    user?.profile_image ||
    user?.image;

  return (
    <div
      className={cn(
        "rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary flex-shrink-0 overflow-hidden",
        s
      )}
    >
      {avatar ? (
        <img
          src={getMediaUrl(avatar)}
          className="w-full h-full object-cover"
          alt=""
        />
      ) : (
        (user?.username?.[0] || "U").toUpperCase()
      )}
    </div>
  );
}

export function QuestionDetails() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { lang } = useLang();
  const [newAnswer, setNewAnswer] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());

  const { data: question, isLoading } = useQuery<any>({
    queryKey: [`/api/questions/${id}`],
    queryFn: async () => {
      const res = await fetch(`/api/questions/${id}/`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
    enabled: !!getAccessToken(),
  });

  const postAnswer = useMutation({
    mutationFn: () => apiRequest("POST", "/api/answers/", {
      content: newAnswer,
      question: Number(id),
    }),
    onSuccess: () => {
      toast({ title: t(lang, "post.toast.answerSent") });
      setNewAnswer("");
      setAnswerDialogOpen(false);
      qc.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
    },
  });

  const postReply = useMutation({
    mutationFn: (answerId: number) => apiRequest("POST", "/api/replies/", {
      content: replyText,
      answer: answerId,
    }),
    onSuccess: () => {
      toast({ title: t(lang, "post.toast.replySent") });
      setReplyText("");
      setReplyingTo(null);
      setReplyDialogOpen(false);
      qc.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
    },
  });

  const toggleReplies = (answerId: number) => {
    setExpandedReplies(prev => {
      const next = new Set(prev);
      if (next.has(answerId)) next.delete(answerId);
      else next.add(answerId);
      return next;
    });
  };

  const openReplyDialog = (answerId: number) => {
    if (!getAccessToken()) { navigate("/login"); return; }
    setReplyingTo(answerId);
    setReplyText("");
    setReplyDialogOpen(true);
  };

  const openAnswerDialog = () => {
    if (!getAccessToken()) { navigate("/login"); return; }
    setNewAnswer("");
    setAnswerDialogOpen(true);
  };

  if (isLoading) return <div className="text-center py-20 text-muted-foreground">{t(lang, "loading")}</div>;
  if (!question) return <div className="text-center py-20">{t(lang, "common.states.notFound")}</div>;

  const answers = question.answers || [];

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      {/* Question */}
      <QuestionCard {...question} onAnswerClick={openAnswerDialog} currentUserId={profile?.id} />

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* Answers */}
      {answers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {t(lang, "noAnswers")}
        </div>
      ) : (
        answers.map((answer: any) => (
          <div key={answer.id}>
            {/* Answer row */}
            <div className="px-4 pt-4 pb-2 hover:bg-muted/20 transition-colors">
              <div className="flex gap-3">
                {/* Left: avatar + thread line */}
                <div className="flex flex-col items-center">
                  
                  <Link href={`/user/${answer.author?.username}`}>
                    <Avatar user={answer.author} size="md" />
                  </Link>
                  {answer.replies?.length > 0 && (
                    <div className="w-0.5 bg-border/50 flex-1 mt-1" style={{ minHeight: 24 }} />
                  )}
                </div>

                {/* Right: content */}
                <div className="flex-1 min-w-0 pb-2">
                  {/* Header */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-sm text-foreground">
                      {answer.author?.first_name
                        ? `${answer.author.first_name} ${answer.author.last_name}`.trim()
                        : answer.author?.username}
                    </span>
                    <span className="text-xs text-muted-foreground">@{answer.author?.username}</span>
                    <span className="text-muted-foreground/40 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">{formatRelativeTime(lang, answer.created_at)}</span>
                  </div>

                  {/* Body */}
                  <div className="mt-1">
                    <MarkdownRenderer content={answer.content || ""} className="text-sm leading-6" />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2 -ml-1.5">
                    <LikeButton upvotes={answer.upvotes ?? answer.likes_count ?? 0} entityId={answer.id.toString()} type="answer" />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => openReplyDialog(answer.id)}
                    >
                      {t(lang, "post.actions.reply")}
                    </Button>
                  </div>
                  <AIComment contextText={answer.content} type="answer" />
                </div>
              </div>
            </div>

            {/* Replies toggle button */}
            {answer.replies?.length > 0 && !expandedReplies.has(answer.id) && (
              <div className="px-4 pb-2 pl-16">
                <button
                  onClick={() => toggleReplies(answer.id)}
                  className="cursor-pointer text-xs text-primary hover:underline font-medium"
                >
                  {t(lang, "post.answers.showReplies", { count: answer.replies.length })}
                </button>
              </div>
            )}

            {/* Replies */}
            {expandedReplies.has(answer.id) && answer.replies?.map((reply: any, idx: number) => (
              <div key={reply.id} className="px-4 pt-3 pb-2 hover:bg-muted/10 transition-colors">
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <Link href={`/user/${reply.author?.username}`}>
                      <Avatar user={reply.author} size="sm" />
                    </Link>
                    {idx < answer.replies.length - 1 && (
                      <div className="w-0.5 bg-border/40 flex-1 mt-1" style={{ minHeight: 16 }} />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pb-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-sm text-foreground">
                        {reply.author?.first_name
                          ? `${reply.author.first_name} ${reply.author.last_name}`.trim()
                          : reply.author?.username}
                      </span>
                      <span className="text-xs text-muted-foreground">@{reply.author?.username}</span>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className="text-xs text-muted-foreground">{formatRelativeTime(lang, reply.created_at)}</span>
                    </div>
                    <p className="text-xs text-primary mt-0.5">
                      {t(lang, "post.answers.replyingTo", { username: answer.author?.username })}
                    </p>
                    <div className="mt-1">
                      <MarkdownRenderer content={reply.content || ""} className="text-sm leading-5" />
                    </div>
                    <div className="mt-1 -ml-1.5">
                      <LikeButton upvotes={reply.upvotes ?? reply.likes_count ?? 0} entityId={reply.id.toString()} type="reply" />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {expandedReplies.has(answer.id) && answer.replies?.length > 0 && (
              <div className="px-4 pb-2 pl-16">
                <button
                  onClick={() => toggleReplies(answer.id)}
                  className="text-xs text-muted-foreground hover:underline"
                >
                  {t(lang, "post.answers.hide")}
                </button>
              </div>
            )}

            <div className="border-t border-border/30" />
          </div>
        ))
      )}

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={(open) => { if (!open) { setReplyingTo(null); setReplyText(""); } setReplyDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(lang, "post.answers.replyDialogTitle")}</DialogTitle>
            <DialogDescription>{t(lang, "post.answers.replyDialogDescription")}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t(lang, "post.answers.replyPlaceholder")}
            className="min-h-[120px] mt-4"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => replyingTo && postReply.mutate(replyingTo)} disabled={!replyText.trim() || postReply.isPending}>
              {t(lang, "common.actions.send")}
            </Button>
            <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>{t(lang, "cancel")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Answer Dialog */}
      <Dialog open={answerDialogOpen} onOpenChange={(open) => { if (!open) setNewAnswer(""); setAnswerDialogOpen(open); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(lang, "post.answers.answerDialogTitle")}</DialogTitle>
            <DialogDescription>{t(lang, "post.answers.answerDialogDescription")}</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder={t(lang, "post.answers.answerPlaceholder")}
            className="min-h-[150px] mt-4 resize-none"
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button onClick={() => postAnswer.mutate()} disabled={!newAnswer.trim() || postAnswer.isPending}>
              {t(lang, "post.answers.post")}
            </Button>
            <Button variant="outline" onClick={() => setAnswerDialogOpen(false)}>{t(lang, "cancel")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
