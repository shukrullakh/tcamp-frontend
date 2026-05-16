import { useEffect, useRef, useState } from "react";
import { BadgeCheck, CalendarClock, Clock, Send, Smile, Trash2, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

const POST_LIMIT = 400;
const DRAFT_KEY = "post_composer_draft";
const SCHEDULED_KEY = "post_composer_scheduled_posts";
const PUBLISH_LOCK_KEY = "post_composer_publish_lock";
const RECENT_EMOJIS_KEY = "post_composer_recent_emojis";
const MENTION_RE = /(^|\s)@([A-Za-z0-9_]{0,30})$/;
const EMOJI_CATEGORIES = [
  {
    name: "Smileys & Emotion",
    emojis: [
      ["😀", "grinning face"], ["😃", "smiling face"], ["😄", "smile"], ["😁", "beaming"], ["😂", "joy"], ["🤣", "rolling laugh"],
      ["😊", "blush"], ["😍", "heart eyes"], ["😘", "kiss"], ["😎", "cool"], ["😭", "cry"], ["😡", "angry"], ["🥳", "party"], ["🤔", "thinking"],
      ["😇", "angel"],["🤓","clever"],
    ],
  },
  {
    name: "People & Body",
    emojis: [
      ["👋", "wave"], ["👏", "clap"], ["🙌", "raised hands"], ["🙏", "pray"], ["💪", "muscle"], ["👍", "thumbs up"], ["👎", "thumbs down"],
      ["🤝", "handshake"], ["🧑", "person"], ["👩", "woman"], ["👨", "man"], ["🧑‍💻", "developer"], ["👀", "eyes"], ["🧠", "brain"],
    ],
  },
  {
    name: "Animals & Nature",
    emojis: [
      ["🐶", "dog"], ["🐱", "cat"], ["🦁", "lion"], ["🐯", "tiger"], ["🐼", "panda"], ["🐸", "frog"], ["🌱", "seedling"],
      ["🌲", "tree"], ["🌍", "earth"], ["☀️", "sun"], ["🌙", "moon"], ["⭐", "star"], ["🔥", "fire"], ["🌈", "rainbow"],
    ],
  },
  {
    name: "Food & Drink",
    emojis: [
      ["🍎", "apple"], ["🍌", "banana"], ["🍇", "grapes"], ["🍕", "pizza"], ["🍔", "burger"], ["🍟", "fries"], ["🌮", "taco"],
      ["🍜", "noodles"], ["🍰", "cake"], ["☕", "coffee"], ["🍵", "tea"], ["🥤", "drink"], ["🍽️", "plate"], ["🥗", "salad"],
    ],
  },
  {
    name: "Travel & Places",
    emojis: [
      ["🚗", "car"], ["🚌", "bus"], ["🚆", "train"], ["✈️", "plane"], ["🚀", "rocket"], ["🏠", "home"], ["🏫", "school"],
      ["🏢", "office"], ["🏔️", "mountain"], ["🏖️", "beach"], ["🗺️", "map"], ["📍", "pin"], ["🕋", "kaaba"], ["🗽", "statue"],
    ],
  },
  {
    name: "Activities",
    emojis: [
      ["⚽", "soccer"], ["🏀", "basketball"], ["🏈", "football"], ["🎾", "tennis"], ["🏆", "trophy"], ["🎮", "game"], ["🎯", "target"],
      ["🎨", "art"], ["🎬", "movie"], ["🎤", "microphone"], ["🎧", "headphones"], ["♟️", "chess"], ["🧩", "puzzle"], ["🎓", "graduation"],
    ],
  },
  {
    name: "Objects",
    emojis: [
      ["📱", "phone"], ["💻", "laptop"], ["⌨️", "keyboard"], ["🖱️", "mouse"], ["📚", "books"], ["📝", "memo"], ["📌", "pushpin"],
      ["💡", "idea"], ["🔒", "lock"], ["🔑", "key"], ["⚙️", "gear"], ["🧪", "science"], ["🩺", "medical"], ["💰", "money"],
    ],
  },
  {
    name: "Symbols",
    emojis: [
      ["❤️", "heart"], ["💙", "blue heart"], ["✅", "check"], ["❌", "cross"], ["⚠️", "warning"], ["❓", "question"], ["❗", "exclamation"],
      ["💯", "hundred"], ["✨", "sparkles"], ["🔴", "red circle"], ["🟢", "green circle"], ["🔵", "blue circle"], ["⬆️", "up"], ["⬇️", "down"],
    ],
  },
  {
    name: "Flags",
    emojis: [
      ["🇺🇿", "uzbekistan flag"], ["🇺🇸", "united states flag"], ["🇬🇧", "united kingdom flag"], ["🇷🇺", "russia flag"], ["🇹🇷", "turkey flag"],
      ["🇰🇷", "korea flag"], ["🇯🇵", "japan flag"], ["🇨🇳", "china flag"], ["🇩🇪", "germany flag"], ["🇫🇷", "france flag"], ["🇮🇳", "india flag"], ["🇧🇷", "brazil flag"],
    ],
  },
] as const;

export interface ScheduledPost {
  id: string;
  content: string;
  createdAt: string;
  scheduledAt: string;
}

interface PostComposerProps {
  onSuccess?: () => void;
}

function readScheduledPosts(): ScheduledPost[] {
  try {
    const value = localStorage.getItem(SCHEDULED_KEY);
    return value ? JSON.parse(value) : [];
  } catch {
    return [];
  }
}

function writeScheduledPosts(posts: ScheduledPost[]) {
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(posts));
}

function readRecentEmojis(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_EMOJIS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeRecentEmojis(emojis: string[]) {
  localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(emojis.slice(0, 24)));
}

function toDateTimeLocalValue(date: Date) {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);
  return localDate.toISOString().slice(0, 16);
}

function mentionLookup(content: string, cursor: number) {
  const beforeCursor = content.slice(0, cursor);
  const match = beforeCursor.match(MENTION_RE);
  if (!match) return null;
  return {
    query: match[2],
    start: beforeCursor.length - match[2].length - 1,
    end: cursor,
  };
}

function HighlightedMentions({ text }: { text: string }) {
  const parts = text.split(/(@[A-Za-z0-9_]{2,30})/g);
  return (
    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground [overflow-wrap:anywhere]">
      {parts.map((part, index) =>
        part.startsWith("@") ? (
          <span key={`${part}-${index}`} className="rounded-md bg-primary/10 px-1 font-semibold text-primary">
            {part}
          </span>
        ) : (
          <span key={`${part}-${index}`}>{part}</span>
        ),
      )}
    </p>
  );
}

async function publishRawPost(content: string) {
  // Text preservation strategy:
  // Send the textarea's raw value directly. No trim, no normalization, no newline replacement.
  return apiRequest("POST", "/api/questions/", {
    description: content,
    tags: "",
  });
}

async function publishDueScheduledPosts(onPublished?: (posts: ScheduledPost[]) => void) {
  const lockUntil = Number(localStorage.getItem(PUBLISH_LOCK_KEY) || "0");
  if (lockUntil > Date.now()) return;

  const posts = readScheduledPosts();
  const duePosts = posts.filter((post) => new Date(post.scheduledAt).getTime() <= Date.now());
  if (!duePosts.length) return;

  localStorage.setItem(PUBLISH_LOCK_KEY, String(Date.now() + 20_000));
  try {
    let nextPosts = posts;
    for (const post of duePosts) {
      await publishRawPost(post.content);
      nextPosts = nextPosts.filter((item) => item.id !== post.id);
      writeScheduledPosts(nextPosts);
      onPublished?.(nextPosts);
    }
  } finally {
    localStorage.removeItem(PUBLISH_LOCK_KEY);
  }
}

export function ScheduledPostPublisher() {
  const qc = useQueryClient();

  useEffect(() => {
    const publish = async () => {
      await publishDueScheduledPosts(() => {
        qc.invalidateQueries({ queryKey: ["/api/questions"] });
      });
    };

    publish();
    const interval = window.setInterval(publish, 30_000);
    return () => window.clearInterval(interval);
  }, [qc]);

  return null;
}

export function PostComposer({ onSuccess }: PostComposerProps) {
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const { toast } = useToast();
  const { lang } = useLang();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(() => localStorage.getItem(DRAFT_KEY) ?? "");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [emojiSearch, setEmojiSearch] = useState("");
  const [activeEmojiCategory, setActiveEmojiCategory] = useState("Smileys & Emotion");
  const [recentEmojis, setRecentEmojis] = useState<string[]>(readRecentEmojis);
  const [scheduledAt, setScheduledAt] = useState(() => toDateTimeLocalValue(new Date(Date.now() + 60 * 60_000)));
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>(readScheduledPosts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [mentionState, setMentionState] = useState<{ query: string; start: number; end: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);

  const remaining = POST_LIMIT - content.length;
  const isOverLimit = remaining < 0;

  const { data: mentionUsers = [], isFetching: mentionLoading } = useQuery<any[]>({
    queryKey: ["/api/mentions/suggest", mentionState?.query || ""],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/mentions/suggest/?q=${encodeURIComponent(mentionState?.query || "")}`);
      return res.json();
    },
    enabled: !!getAccessToken() && mentionState !== null,
    staleTime: 25_000,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const res = await publishRawPost(content);
      return res.json();
    },
    onSuccess: (data) => {
      setContent("");
      localStorage.removeItem(DRAFT_KEY);
      qc.invalidateQueries({ queryKey: ["/api/questions"] });
      navigate(`/question/${data.id}`);
      onSuccess?.();
    },
  });

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, content);
  }, [content]);

  useEffect(() => {
    setMentionIndex(0);
  }, [mentionState?.query]);

  useEffect(() => {
    writeScheduledPosts(scheduledPosts);
  }, [scheduledPosts]);

  useEffect(() => {
    const publish = async () => {
      await publishDueScheduledPosts((nextPosts) => {
        setScheduledPosts(nextPosts);
        qc.invalidateQueries({ queryKey: ["/api/questions"] });
      });
    };

    publish();
    const interval = window.setInterval(publish, 30_000);
    return () => window.clearInterval(interval);
  }, [qc]);

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const nextContent = content.slice(0, start) + emoji + content.slice(end);
    setContent(nextContent);
    setRecentEmojis((current) => {
      const next = [emoji, ...current.filter((item) => item !== emoji)];
      writeRecentEmojis(next);
      return next.slice(0, 24);
    });

    window.setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
  };

  const insertMention = (user: any) => {
    if (!mentionState) return;
    const nextContent = `${content.slice(0, mentionState.start)}@${user.username} ${content.slice(mentionState.end)}`;
    setContent(nextContent);
    setMentionState(null);
    window.setTimeout(() => {
      const position = mentionState.start + user.username.length + 2;
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(position, position);
    }, 0);
  };

  const handleComposerChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setContent(value);
    setMentionState(mentionLookup(value, event.target.selectionStart));
  };

  const handleComposerKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!mentionState || mentionUsers.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMentionIndex((index) => Math.min(index + 1, mentionUsers.length - 1));
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setMentionIndex((index) => Math.max(index - 1, 0));
    }
    if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      insertMention(mentionUsers[mentionIndex]);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setMentionState(null);
    }
  };

  const categoryEntries =
    EMOJI_CATEGORIES.find((category) => category.name === activeEmojiCategory)?.emojis ?? EMOJI_CATEGORIES[0].emojis;
  const normalizedSearch = emojiSearch.trim().toLowerCase();
  const displayedEmojiSections = normalizedSearch
    ? EMOJI_CATEGORIES.map((category) => ({
        name: category.name,
        emojis: category.emojis.filter(([emoji, name]) => emoji.includes(normalizedSearch) || name.includes(normalizedSearch)),
      })).filter((category) => category.emojis.length > 0)
    : [
        ...(recentEmojis.length
          ? [{ name: "Recently used", emojis: recentEmojis.map((emoji) => [emoji, "recent"] as const) }]
          : []),
        { name: activeEmojiCategory, emojis: categoryEntries },
      ];

  const schedulePost = () => {
    if (content.length === 0 || isOverLimit) return;

    const date = new Date(scheduledAt);
    if (Number.isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      toast({ title: t(lang, "post.composer.futureTime"), variant: "destructive" });
      return;
    }

    const post: ScheduledPost = {
      id: editingId ?? crypto.randomUUID(),
      content,
      createdAt: editingId
        ? scheduledPosts.find((item) => item.id === editingId)?.createdAt ?? new Date().toISOString()
        : new Date().toISOString(),
      scheduledAt: date.toISOString(),
    };

    setScheduledPosts((posts) => {
      const withoutCurrent = posts.filter((item) => item.id !== post.id);
      return [...withoutCurrent, post].sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
    });
    setContent("");
    setEditingId(null);
    setShowScheduler(false);
    localStorage.removeItem(DRAFT_KEY);
    toast({ title: editingId ? t(lang, "post.composer.scheduleUpdated") : t(lang, "post.composer.scheduled") });
  };

  const editScheduledPost = (post: ScheduledPost) => {
    setContent(post.content);
    setScheduledAt(toDateTimeLocalValue(new Date(post.scheduledAt)));
    setEditingId(post.id);
    setShowScheduler(true);
    textareaRef.current?.focus();
  };

  const deleteScheduledPost = (id: string) => {
    setScheduledPosts((posts) => posts.filter((post) => post.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setContent("");
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <Textarea
          ref={textareaRef}
          placeholder={t(lang, "post.composer.placeholder")}
          value={content}
          onChange={handleComposerChange}
          onKeyDown={handleComposerKeyDown}
          className="min-h-36 resize-y border-0 bg-transparent px-0 text-base shadow-none outline-none focus-visible:ring-0 whitespace-pre-wrap break-words [overflow-wrap:anywhere]"
        />

        {mentionState && (
          <div className="mb-3 overflow-hidden rounded-2xl border border-border/70 bg-background/95 shadow-xl backdrop-blur-xl">
            <div className="border-b border-border/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
              {mentionLoading ? t(lang, "post.mentions.finding") : t(lang, "post.mentions.mentionSomeone")}
            </div>
            <div className="max-h-64 overflow-y-auto p-1">
              {mentionUsers.length === 0 && !mentionLoading ? (
                <div className="px-3 py-6 text-center text-sm text-muted-foreground">{t(lang, "post.mentions.noMatchingPeople")}</div>
              ) : (
                mentionUsers.map((user: any, index: number) => (
                  <button
                    key={user.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      insertMention(user);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition hover:bg-muted/70",
                      mentionIndex === index && "bg-muted/80",
                    )}
                  >
                    <Avatar className="h-9 w-9 border border-border/70">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{(user.first_name?.[0] || user.username?.[0] || "U").toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1">
                        <span className="truncate text-sm font-semibold">{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}</span>
                        {user.is_verified && <BadgeCheck className="h-3.5 w-3.5 fill-primary text-primary-foreground" />}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {content.includes("@") && (
          <div className="mb-3 rounded-xl border border-border/60 bg-muted/25 px-3 py-2">
            <HighlightedMentions text={content} />
          </div>
        )}

        {showEmojiPicker && (
          <div className="mt-3 w-full rounded-xl border bg-popover p-3 shadow-sm">
            <Input
              value={emojiSearch}
              onChange={(event) => setEmojiSearch(event.target.value)}
              placeholder={t(lang, "post.emoji.search")}
              className="mb-3 h-9"
            />
            <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
              {EMOJI_CATEGORIES.map((category) => (
                <button
                  key={category.name}
                  type="button"
                  onClick={() => {
                    setActiveEmojiCategory(category.name);
                    setEmojiSearch("");
                  }}
                  className={cn(
                    "whitespace-nowrap rounded-full px-3 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
                    activeEmojiCategory === category.name && !emojiSearch && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                  )}
                >
                  {category.name}
                </button>
              ))}
            </div>
            <div className="max-h-72 overflow-y-auto pr-1">
              {displayedEmojiSections.map((section) => (
                <div key={section.name} className="mb-3">
                  <div className="mb-1 text-xs font-medium text-muted-foreground">{section.name}</div>
                  <div className="grid grid-cols-8 gap-1 sm:grid-cols-10">
                    {section.emojis.map(([emoji, name]) => (
                      <button
                        key={`${section.name}-${emoji}-${name}`}
                        type="button"
                        title={name}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-xl hover:bg-muted"
                        onClick={() => insertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {displayedEmojiSections.length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">{t(lang, "post.emoji.none")}</div>
              )}
            </div>
          </div>
        )}

        {showScheduler && (
          <div className="mt-3 flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-center">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="sm:max-w-60"
            />
            <Button type="button" size="sm" onClick={schedulePost} disabled={content.length === 0 || isOverLimit}>
              {editingId ? t(lang, "post.composer.updateSchedule") : t(lang, "post.composer.schedulePost")}
            </Button>
            <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => setShowScheduler(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t pt-3">
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowEmojiPicker((value) => !value)}>
              <Smile className="h-4 w-4" />
            </Button>
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9" onClick={() => setShowScheduler((value) => !value)}>
              <CalendarClock className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <span className={cn("text-sm text-muted-foreground", isOverLimit && "text-destructive")}>
              {remaining}
            </span>
            <Button
              type="button"
              onClick={() => publishMutation.mutate()}
              disabled={content.length === 0 || isOverLimit || publishMutation.isPending}
              className="rounded-full px-5"
            >
              <Send className="mr-2 h-4 w-4" />
              {t(lang, "post.composer.post")}
            </Button>
          </div>
        </div>
      </div>

      {scheduledPosts.length > 0 && (
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 text-sm font-semibold">{t(lang, "post.composer.scheduledPosts")}</div>
          <div className="divide-y">
            {scheduledPosts.map((post) => (
              <div key={post.id} className="space-y-3 p-4">
                <div className="text-xs text-muted-foreground">
                  {new Date(post.scheduledAt).toLocaleString()}
                </div>
                <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] text-sm leading-relaxed">{post.content}</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => editScheduledPost(post)}>
                    {t(lang, "edit")}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => deleteScheduledPost(post.id)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    {t(lang, "delete")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
