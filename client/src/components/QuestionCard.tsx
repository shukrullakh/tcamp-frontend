import { Link } from "wouter";
import { useEffect, useState } from "react";
import { Ban, BellOff, Edit3, Flag, MessageSquare, MoreHorizontal, Pin, PinOff, Repeat2, Trash2, UserMinus, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { LikeButton } from "./LikeButton";
import { RepostButton } from "./RepostButton";
import { SaveButton } from "./SaveButton";
import { ShareButton } from "./ShareButton";
import { UserCard } from "./UserCard";
import { AIComment } from "./AIComment";
import { apiRequest, getAccessToken, queryClient } from "@/lib/queryClient";
import { readSocialState, toggleNumber, writeSocialState } from "@/lib/socialState";
import { useLang } from "@/components/LanguageContext";
import { formatRelativeTime, t } from "@/i18n";

interface QuestionCardProps {
  id: number;
  title?: string;
  description?: string;
  content?: string;
  author: { id: number; username: string } | string;
  authorAvatar?: string;
  created_at?: string;
  createdAt?: string;
  likes?: number;
  likes_count?: number;
  reposts_count?: number;
  upvotes?: number;
  downvotes?: number;
  is_repost?: boolean;
  reposted_by?: string;
  quote_text?: string;
  initialSaved?: boolean;
  tags?: string | string[];
  answers: any[];
  compact?: boolean;
  previewLength?: number;
  onAnswerClick?: () => void;
  currentUserId?: number;
}

function MentionText({ text }: { text: string }) {
  return (
    <>
      {text.split(/(@[A-Za-z0-9_]{2,30})/g).map((part, index) =>
        part.startsWith("@") ? (
          <span key={`${part}-${index}`} className="font-semibold text-primary">{part}</span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </>
  );
}

export function QuestionCard({
  id,
  title,
  description,
  content,
  author,
  authorAvatar,
  created_at,
  createdAt,
  likes = 0,
  likes_count,
  reposts_count = 0,
  upvotes,
  downvotes,
  is_repost,
  reposted_by,
  quote_text,
  initialSaved = false,
  tags,
  answers = [],
  compact = false,
  previewLength,
  onAnswerClick,
  currentUserId,
}: QuestionCardProps) {
  const { toast } = useToast();
  const { lang } = useLang();
  const [isExpanded, setIsExpanded] = useState(false);
  const [socialState, setSocialState] = useState(readSocialState);
  const [isFollowingAuthor, setIsFollowingAuthor] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editContent, setEditContent] = useState(description || content || "");
  const authorName = typeof author === "object" ? author.username : author;
  const authorId = typeof author === "object" ? author.id : null;
  const bodyText = description || content || "";
  const previewLimit = previewLength ?? (compact ? 250 : 0);
  const shouldTruncate = previewLimit > 0 && bodyText.length > previewLimit;
  const visibleBodyText =
    shouldTruncate && !isExpanded
      ? `${bodyText.slice(0, previewLimit)}...`
      : bodyText;
  const dateStr = created_at || createdAt || "";
  const displayDate = dateStr ? formatRelativeTime(lang, dateStr) : "";
  const likeCount = likes_count ?? likes;
  const isOwnPost = currentUserId === authorId;
  const isMuted = Boolean(authorId && socialState.mutedUserIds.includes(authorId));
  const isBlocked = Boolean(authorId && socialState.blockedUserIds.includes(authorId));
  const isReported = socialState.reportedPostIds.includes(id);
  const isPinned = socialState.pinnedPostIds.includes(id);

  useEffect(() => {
    const handleStateChange = (event: Event) => {
      setSocialState((event as CustomEvent).detail ?? readSocialState());
    };

    window.addEventListener("social-state-change", handleStateChange);
    return () => window.removeEventListener("social-state-change", handleStateChange);
  }, []);

  useEffect(() => {
    setEditContent(description || content || "");
  }, [description, content]);

  useEffect(() => {
    const checkFollow = async () => {
      if (!authorId || !getAccessToken() || isOwnPost) return;
      try {
        const res = await apiRequest("GET", `/api/users/${authorId}/follow/`);
        const data = await res.json();
        setIsFollowingAuthor(Boolean(data.following));
      } catch {}
    };
    checkFollow();
  }, [authorId, isOwnPost]);

  if ((isMuted || isBlocked) && !isOwnPost) {
    return null;
  }

  const updateSocialState = (updater: ReturnType<typeof readSocialState> | ((state: ReturnType<typeof readSocialState>) => ReturnType<typeof readSocialState>)) => {
    const nextState = typeof updater === "function" ? updater(readSocialState()) : updater;
    writeSocialState(nextState);
    setSocialState(nextState);
  };

  const handleNotInterested = () => {
    updateSocialState((state) => ({
      ...state,
      reportedPostIds: state.reportedPostIds.includes(id) ? state.reportedPostIds : [...state.reportedPostIds, id],
    }));
    toast({ title: t(lang, "post.toast.hidden"), description: t(lang, "post.toast.hiddenDescription") });
  };

  const handleFollowAuthor = async () => {
    if (!authorId || !getAccessToken()) return;
    try {
      const res = await apiRequest("POST", `/api/users/${authorId}/follow/`);
      const data = await res.json();
      setIsFollowingAuthor(Boolean(data.following));
      queryClient.invalidateQueries({ queryKey: [`/api/users/${authorId}`] });
      toast({ title: data.following ? t(lang, "profile.toast.followed", { username: authorName }) : t(lang, "profile.toast.unfollowed", { username: authorName }) });
    } catch {
      toast({ title: t(lang, "post.toast.followError"), variant: "destructive" });
    }
  };

  const handleMuteAuthor = () => {
    if (!authorId) return;
    updateSocialState((state) => ({ ...state, mutedUserIds: toggleNumber(state.mutedUserIds, authorId) }));
    toast({ title: isMuted ? t(lang, "profile.actions.follow", { username: authorName }) : t(lang, "profile.actions.mute", { username: authorName }) });
  };

  const handleBlockAuthor = () => {
    if (!authorId) return;
    updateSocialState((state) => ({ ...state, blockedUserIds: toggleNumber(state.blockedUserIds, authorId) }));
    toast({ title: isBlocked ? t(lang, "profile.actions.unblock", { username: authorName }) : t(lang, "profile.actions.block", { username: authorName }), variant: isBlocked ? "default" : "destructive" });
  };

  const handleReportPost = () => {
    updateSocialState((state) => ({ ...state, reportedPostIds: toggleNumber(state.reportedPostIds, id) }));
    toast({ title: isReported ? t(lang, "post.toast.reportRemoved") : t(lang, "post.toast.reported") });
  };

  const handleTogglePin = () => {
    updateSocialState((state) => ({ ...state, pinnedPostIds: toggleNumber(state.pinnedPostIds, id) }));
    toast({ title: isPinned ? t(lang, "post.toast.unpinned") : t(lang, "post.toast.pinned") });
  };

  const handleDeletePost = async () => {
    if (!getAccessToken()) return;

    try {
      await apiRequest("DELETE", `/api/questions/${id}/`);
      toast({ title: t(lang, "post.toast.deleted") });
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
    } catch (err) {
      toast({ title: t(lang, "error"), variant: "destructive" });
    }
  };

  const handleEditPost = async () => {
    try {
      // Keep raw editContent exactly as typed. No trim, no formatting normalization.
      await apiRequest("PATCH", `/api/questions/${id}/`, { description: editContent });
      setEditOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/questions"] });
      queryClient.invalidateQueries({ queryKey: [`/api/questions/${id}`] });
      toast({ title: t(lang, "post.toast.updated") });
    } catch {
      toast({ title: t(lang, "post.toast.updateFailed"), variant: "destructive" });
    }
  };

  const tagList: string[] =
    typeof tags === "string"
      ? tags.split(",").map((t) => t.trim()).filter(Boolean)
      : Array.isArray(tags)
      ? tags
      : [];

  return (
    <div className="border-b border-border/40 hover:bg-muted/30 transition-colors duration-200 px-4 py-3 cursor-pointer group">
      {/* Reposted label */}
      {isPinned && (
        <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-muted-foreground">
          <Pin className="w-3.5 h-3.5" />
          <span>{t(lang, "post.actions.pin")}</span>
        </div>
      )}
      {is_repost && (
        <div className="mb-2 flex items-center gap-2 pl-8 text-[11px] font-semibold text-muted-foreground">
          <Repeat2 className="w-3.5 h-3.5" />
          <span>{reposted_by ? t(lang, "post.repost.repostedBy", { username: reposted_by }) : t(lang, "post.repost.reposted")}</span>
        </div>
      )}
      {quote_text && (
        <div className="mb-3 rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm leading-6 shadow-inner">
          <MentionText text={quote_text} />
        </div>
      )}

      {/* Header with author and date */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
        <div className="flex min-w-0 flex-1 items-center gap-2 text-xs text-muted-foreground">
          {typeof author === 'object' ? (
            <UserCard author={author} />
          ) : (
            <span className="truncate font-medium text-foreground/80">{authorName}</span>
          )}
          {displayDate && (
            <span className="text-muted-foreground/60">• {displayDate}</span>
          )}
        </div>

        {/* Three-dot menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-primary/10">
              <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {isOwnPost ? (
              <>
                <DropdownMenuItem onClick={() => setEditOpen(true)} className="cursor-pointer">
                  <Edit3 className="w-4 h-4 mr-2" />
                  <span>{t(lang, "post.actions.editPost")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleTogglePin} className="cursor-pointer">
                  {isPinned ? <PinOff className="w-4 h-4 mr-2" /> : <Pin className="w-4 h-4 mr-2" />}
                  <span>{isPinned ? t(lang, "post.actions.unpin") : t(lang, "post.actions.pin")}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeletePost} className="cursor-pointer text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  <span>{t(lang, "post.actions.deletePost")}</span>
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={handleNotInterested} className="cursor-pointer">
                  <BellOff className="w-4 h-4 mr-2" />
                  <span>{t(lang, "post.actions.notInterested")}</span>
                </DropdownMenuItem>
                {authorId && (
                  <DropdownMenuItem onClick={handleFollowAuthor} className="cursor-pointer">
                    {isFollowingAuthor ? <UserMinus className="w-4 h-4 mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    <span>{isFollowingAuthor ? t(lang, "profile.actions.unfollow") : t(lang, "profile.actions.follow")} @{authorName}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleMuteAuthor} className="cursor-pointer">
                  <BellOff className="w-4 h-4 mr-2" />
                  <span>{t(lang, "profile.actions.mute", { username: authorName })}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlockAuthor} className="cursor-pointer text-destructive">
                  <Ban className="w-4 h-4 mr-2" />
                  <span>{t(lang, "profile.actions.block", { username: authorName })}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReportPost} className="cursor-pointer">
                  <Flag className="w-4 h-4 mr-2" />
                  <span>{isReported ? t(lang, "post.actions.unreport") : t(lang, "post.actions.report")}</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Main content */}
      <Link href={`/question/${id}`}>
        <p className="mb-3 cursor-pointer whitespace-pre-wrap break-words text-sm leading-relaxed transition-colors [word-break:break-word] hover:text-primary">
          <MentionText text={visibleBodyText} />
        </p>
      </Link>
      {shouldTruncate && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="mb-3 h-7 px-2 text-xs text-primary hover:text-primary"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded((value) => !value);
          }}
        >
          {isExpanded ? t(lang, "post.actions.showLess") : t(lang, "post.actions.showMore")}
        </Button>
      )}

      {/* Tags */}
      {!compact && tagList.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tagList.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-1.5 py-0 text-xs font-normal bg-secondary/40 hover:bg-secondary/60">
              #{tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <LikeButton upvotes={upvotes ?? likeCount} downvotes={downvotes ?? 0} entityId={id.toString()} type="question" />
          <Link href={`/question/${id}`}>
            <span className="flex items-center gap-1.5 hover:text-primary px-2 py-1 transition-colors rounded-md">
              <MessageSquare className="w-3.5 h-3.5" />
              {answers.length}
            </span>
          </Link>
          <RepostButton entityId={id.toString()} type="question" count={reposts_count} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <SaveButton entityId={id.toString()} initialSaved={initialSaved} />
          <ShareButton entityId={id.toString()} title={bodyText?.substring(0, 50)} type="question" />
        </div>
      </div>

      {/* AI Comment */}
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <AIComment contextText={bodyText} type="question" />
        {onAnswerClick && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onAnswerClick();
            }}
          >
            {t(lang, "post.actions.writeAnswer")}
          </Button>
        )}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t(lang, "post.actions.editPost")}</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editContent}
            onChange={(event) => setEditContent(event.target.value)}
            className="min-h-36 whitespace-pre-wrap break-words [word-break:break-word]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t(lang, "cancel")}</Button>
            <Button onClick={handleEditPost} disabled={editContent.length > 280}>{t(lang, "save")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
