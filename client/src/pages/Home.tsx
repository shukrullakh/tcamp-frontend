import { useEffect, useMemo, useRef, useState } from "react";
import type { ElementType, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  Hash,
  Loader2,
  MessageCircle,
  Search,
  Sparkles,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QuestionCard } from "@/components/QuestionCard";
import { SuggestedUsers } from "@/components/SuggestedUsers";
import { AskQuestion } from "./AskQuestion";
import { FollowButton, ProfileUser, getDisplayName, getInitial, useDebouncedValue } from "@/components/profile/ProfileSocial";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLang } from "@/components/LanguageContext";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { t } from "@/i18n";

type SearchQuestion = {
  id?: number;
  title: string;
  description?: string;
  author?: ProfileUser;
  answers_count?: number;
  likes_count?: number;
  href: string;
};

type SearchTopic = {
  tag: string;
  title: string;
  description: string;
  href: string;
};

type SearchCommunity = {
  name: string;
  tag: string;
  members: number;
};

type SearchPayload = {
  users: ProfileUser[];
  questions: SearchQuestion[];
  topics: SearchTopic[];
  recent_searches: string[];
  trending_searches: string[];
  communities: SearchCommunity[];
  suggestions: string[];
};

type SearchItem =
  | { type: "user"; id: string; href: string; label: string }
  | { type: "question"; id: string; href: string; label: string }
  | { type: "topic"; id: string; href: string; label: string }
  | { type: "history"; id: string; href: string; label: string };

const defaultSearch: SearchPayload = {
  users: [],
  questions: [],
  topics: [],
  recent_searches: [],
  trending_searches: ["react", "cybersecurity", "python", "ai", "design"],
  communities: [],
  suggestions: ["React roadmap", "Cybersecurity roadmap", "Best campus projects"],
};

function localRecentSearches() {
  try {
    return JSON.parse(localStorage.getItem("recent_searches") || "[]") as string[];
  } catch {
    return [];
  }
}

function rememberSearch(value: string) {
  const query = value.trim();
  if (!query) return;
  const next = [query, ...localRecentSearches().filter((item) => item.toLowerCase() !== query.toLowerCase())].slice(0, 8);
  localStorage.setItem("recent_searches", JSON.stringify(next));
}

function SectionTitle({ icon: Icon, children }: { icon: ElementType; children: ReactNode }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 bg-background/80 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground backdrop-blur-xl">
      <Icon className="h-3.5 w-3.5" />
      {children}
    </div>
  );
}

function SearchSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SocialSearch({ profileId }: { profileId?: number }) {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const isMobile = useIsMobile();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const debouncedQuery = useDebouncedValue(query, 360);

  const { data = defaultSearch, isFetching } = useQuery<SearchPayload>({
    queryKey: ["/api/search", debouncedQuery],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`/api/search/?q=${encodeURIComponent(debouncedQuery)}&limit=6`, { headers });
      if (!res.ok) throw new Error("Search failed");
      const payload = await res.json();
      return { ...defaultSearch, ...payload, recent_searches: [...localRecentSearches(), ...(payload.recent_searches || [])].slice(0, 8) };
    },
    enabled: open,
    staleTime: 30_000,
  });

  const history = useMemo(() => {
    const values = debouncedQuery ? data.suggestions : [...localRecentSearches(), ...data.trending_searches];
    return Array.from(new Set(values.filter(Boolean))).slice(0, 6);
  }, [data.suggestions, data.trending_searches, debouncedQuery]);

  const selectableItems: SearchItem[] = useMemo(() => {
    const users = data.users.map((user) => ({ type: "user" as const, id: `user-${user.id}`, href: `/profile/${user.username}`, label: getDisplayName(user) }));
    const questions = data.questions.map((question, index) => ({ type: "question" as const, id: `question-${question.id || index}`, href: question.href, label: question.title }));
    const topics = data.topics.map((topic) => ({ type: "topic" as const, id: `topic-${topic.tag}`, href: topic.href, label: topic.tag }));
    const recent = history.map((item) => ({ type: "history" as const, id: `history-${item}`, href: `/?search=${encodeURIComponent(item)}`, label: item }));
    return [...users, ...questions, ...topics, ...recent];
  }, [data.questions, data.topics, data.users, history]);

  useEffect(() => setActiveIndex(0), [debouncedQuery, open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, Math.max(0, selectableItems.length - 1)));
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(0, index - 1));
      }
      if (event.key === "Enter" && selectableItems[activeIndex]) {
        event.preventDefault();
        const item = selectableItems[activeIndex];
        rememberSearch(item.label);
        setOpen(false);
        navigate(item.href);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, navigate, open, selectableItems]);

  useEffect(() => {
    if (open && isMobile) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [isMobile, open]);

  const go = (href: string, label: string) => {
    rememberSearch(label);
    setOpen(false);
    navigate(href);
  };

  const panel = (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "overflow-hidden border border-border/70 bg-background/86 shadow-2xl shadow-black/15 backdrop-blur-2xl",
        isMobile ? "fixed inset-0 z-50 rounded-none" : "absolute left-0 right-0 top-12 z-50 max-h-[min(78vh,720px)] rounded-2xl",
      )}
      role="listbox"
      aria-label={t(lang, "common.search.results")}
    >
      <div className="sticky top-0 z-20 border-b border-border/70 bg-background/80 p-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(lang, "common.search.mobilePlaceholder")}
            className="h-11 rounded-full border-0 bg-muted/70"
          />
          <Button size="icon" variant="ghost" className="rounded-full" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-[calc(100dvh-70px)] overflow-y-auto overscroll-contain py-2 md:max-h-[640px]">
        {isFetching ? (
          <SearchSkeleton />
        ) : (
          <>
            {data.users.length > 0 && (
              <section>
                <SectionTitle icon={Users}>{t(lang, "common.search.users")}</SectionTitle>
                {data.users.map((user) => (
                  <div
                    key={user.id}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/55",
                      selectableItems[activeIndex]?.id === `user-${user.id}` && "bg-muted/70",
                    )}
                  >
                    <button type="button" onClick={() => go(`/profile/${user.username}`, user.username)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                      <Avatar className="h-12 w-12 border border-border/70">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitial(user)}</AvatarFallback>
                      </Avatar>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1">
                          <span className="truncate text-sm font-bold">{getDisplayName(user)}</span>
                          {user.is_verified && <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />}
                        </span>
                        <span className="block text-xs text-muted-foreground">@{user.username}</span>
                        {user.bio && <span className="mt-1 line-clamp-2 text-sm text-muted-foreground">{user.bio}</span>}
                        {user.mutual_followers?.length ? (
                          <span className="mt-1 block text-xs text-muted-foreground">{t(lang, "common.search.followedBy", { names: user.mutual_followers.slice(0, 2).join(", ") })}</span>
                        ) : null}
                      </span>
                    </button>
                    {user.id === profileId ? (
                      <Badge variant="secondary" className="mt-1 rounded-full">{t(lang, "profile.labels.you")}</Badge>
                    ) : (
                      <FollowButton user={user} viewerId={profileId} size="sm" invalidateKeys={[[`/api/search`, debouncedQuery]]} />
                    )}
                  </div>
                ))}
              </section>
            )}

            <section>
              <SectionTitle icon={MessageCircle}>{t(lang, "common.search.questions")}</SectionTitle>
              {data.questions.slice(0, 5).map((question, index) => (
                <button
                  key={`${question.href}-${index}`}
                  type="button"
                  onClick={() => go(question.href, question.title)}
                  className={cn(
                    "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-muted/55",
                    selectableItems[activeIndex]?.id === `question-${question.id || index}` && "bg-muted/70",
                  )}
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-1 text-sm font-semibold">{question.title}</span>
                    <span className="line-clamp-2 text-sm text-muted-foreground">{question.description || t(lang, "common.search.startDiscussion")}</span>
                    <span className="mt-1 block text-xs text-muted-foreground">{t(lang, "profile.stats.answers", { count: question.answers_count || 0 })} · {t(lang, "post.actions.like")} {question.likes_count || 0}</span>
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </section>

            <section>
              <SectionTitle icon={TrendingUp}>{t(lang, "common.search.trendingTopics")}</SectionTitle>
              <div className="grid gap-2 px-3 py-2 sm:grid-cols-2">
                {data.topics.slice(0, 6).map((topic) => (
                  <button
                    key={topic.tag}
                    type="button"
                    onClick={() => go(topic.href, topic.tag)}
                    className="rounded-xl border border-border/60 bg-card/55 p-3 text-left transition hover:-translate-y-0.5 hover:bg-muted/60 hover:shadow-md"
                  >
                    <span className="flex items-center gap-2 text-sm font-bold"><Hash className="h-4 w-4 text-primary" />{topic.tag.replace("#", "")}</span>
                    <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{topic.description}</span>
                  </button>
                ))}
              </div>
            </section>

            {data.communities.length > 0 && (
              <section>
                <SectionTitle icon={Users}>{t(lang, "common.search.suggestedCommunities")}</SectionTitle>
                <div className="flex gap-2 overflow-x-auto px-4 py-2">
                  {data.communities.map((community) => (
                    <button key={community.tag} type="button" onClick={() => go(`/?search=${encodeURIComponent(community.tag)}`, community.tag)} className="min-w-44 rounded-xl border border-border/60 bg-card/60 p-3 text-left transition hover:bg-muted/60">
                      <span className="text-sm font-bold">{community.name}</span>
                      <span className="block text-xs text-muted-foreground">{t(lang, "common.search.members", { count: community.members.toLocaleString() })}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionTitle icon={Clock3}>{t(lang, "common.search.recentSearches")}</SectionTitle>
              <div className="flex flex-wrap gap-2 px-4 py-3">
                {history.map((item) => (
                  <button key={item} type="button" onClick={() => go(`/?search=${encodeURIComponent(item)}`, item)} className="rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-sm transition hover:bg-muted">
                    {item}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        placeholder={t(lang, "common.search.placeholder")}
        aria-expanded={open}
        aria-controls="home-search-results"
        className="h-11 rounded-2xl border-border/70 bg-card/80 pl-9 shadow-sm backdrop-blur transition focus-visible:ring-primary/30"
      />
      <AnimatePresence>{open && panel}</AnimatePresence>
    </div>
  );
}

export function Home() {
  const [location] = useLocation();
  const { lang } = useLang();
  const [tab, setTab] = useState("for-you");
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const urlSearch = new URLSearchParams(location.split("?")[1] || "").get("search") || "";

  const { data: myReposts = [] } = useQuery<any[]>({
    queryKey: ["/api/reposts"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/reposts/");
      return res.json();
    },
    enabled: !!getAccessToken(),
  });

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile/");
      return res.json();
    },
    enabled: !!getAccessToken(),
  });

  const { data: questions = [], isLoading, isError } = useQuery<any[]>({
    queryKey: ["/api/questions"],
  });

  const { data: following = [] } = useQuery<any[]>({
    queryKey: ["/api/following"],
    enabled: !!getAccessToken(),
  });

  const allPosts = useMemo(() => {
    const originals = questions.map((question: any) => ({ ...question, timeline_id: `post-${question.id}`, _sortDate: question.created_at }));
    const reposts = myReposts.map((question: any) => ({
      ...question,
      author: {
        ...question.author,
        avatar: question.author?.avatar || question.author?.profile_image || question.author?.image || null,
      },
      _sortDate: question.reposted_at,
      is_repost: true,
      reposted_by: question.reposted_by || profile?.username || "me",
    }));
    return [...originals, ...reposts].filter((post, index, array) => array.findIndex((item) => item.timeline_id === post.timeline_id) === index);
  }, [myReposts, profile?.username, questions]);

  const filteredPosts = useMemo(() => {
    const value = urlSearch.trim().toLowerCase();
    if (!value) return allPosts;
    return allPosts.filter((post: any) => {
      const tags = Array.isArray(post.tags) ? post.tags.join(" ") : post.tags || "";
      return `${post.description || ""} ${post.author?.username || ""} ${post.author?.first_name || ""} ${post.author?.last_name || ""} ${tags}`.toLowerCase().includes(value);
    });
  }, [allPosts, urlSearch]);

  const sortByDate = (a: any, b: any) => new Date(b._sortDate || b.created_at).getTime() - new Date(a._sortDate || a.created_at).getTime();
  const forYouQuestions = [...filteredPosts].sort(sortByDate);
  const followingUserIds = following.map((user: any) => user.id);
  const followingQuestions = filteredPosts.filter((question: any) => followingUserIds.includes(question.author?.id)).sort(sortByDate);

  return (
    <div className="space-y-6 pb-10">
      <section className="space-y-4 py-8 text-center md:py-12">
        <h1 className="text-4xl font-heading font-bold tracking-tight md:text-5xl">{t(lang, "post.hero.title")}</h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
          {t(lang, "post.hero.description")}
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg" className="rounded-full px-7 shadow-lg shadow-primary/15">{t(lang, "askQuestion")}</Button>
            </DialogTrigger>
            <DialogContent className="top-20 max-h-[calc(100vh-6rem)] w-full max-w-4xl translate-y-0 overflow-hidden rounded-2xl bg-background p-0 shadow-2xl">
              <AskQuestion onSuccess={() => setAskDialogOpen(false)} />
            </DialogContent>
          </Dialog>
          <Link href="/ask-ai">
            <Button variant="outline" size="lg" className="rounded-full px-7">{t(lang, "post.hero.askAI")}</Button>
          </Link>
        </div>
      </section>

      <div className="sticky top-16 z-40 rounded-2xl border border-border/70 bg-background/78 p-3 shadow-sm backdrop-blur-2xl">
        <SocialSearch profileId={profile?.id} />
        <Tabs value={tab} onValueChange={setTab} className="mt-3 w-full">
          <div className="flex justify-center">
            <TabsList className="h-auto gap-2 rounded-full bg-muted/55 p-1">
              <TabsTrigger value="for-you" className="rounded-full px-5 py-2 text-sm">
                <Sparkles className="mr-2 h-4 w-4" />
                {t(lang, "post.filters.forYou")}
              </TabsTrigger>
              <TabsTrigger value="following" className="rounded-full px-5 py-2 text-sm">
                <Users className="mr-2 h-4 w-4" />
                {t(lang, "post.filters.following")}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="for-you" className="mt-5 grid gap-2">
            {isLoading ? (
              <div className="grid min-h-60 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : isError ? (
              <div className="grid min-h-60 place-items-center text-red-500">{t(lang, "error")}</div>
            ) : forYouQuestions.length > 0 ? (
              forYouQuestions.map((question: any) => <QuestionCard key={question.timeline_id || `${question.is_repost ? "repost" : "post"}-${question.id}`} {...question} compact currentUserId={profile?.id} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/25 py-16 text-center">
                <h3 className="text-lg font-semibold">{t(lang, "noQuestions")}</h3>
                <p className="text-muted-foreground">{t(lang, "noQuestionsDesc")}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="mt-5 grid gap-2">
            {isLoading ? (
              <div className="grid min-h-60 place-items-center text-muted-foreground"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : followingQuestions.length > 0 ? (
              followingQuestions.map((question: any) => <QuestionCard key={question.timeline_id || `${question.is_repost ? "repost" : "post"}-${question.id}`} {...question} compact currentUserId={profile?.id} />)
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-muted/25 py-16 text-center">
                <h3 className="text-lg font-semibold">{t(lang, "post.empty.followingTitle")}</h3>
                <p className="text-muted-foreground">{t(lang, "post.empty.followingDescription")}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <SuggestedUsers viewerId={profile?.id} />
    </div>
  );
}
