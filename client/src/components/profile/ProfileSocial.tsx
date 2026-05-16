import { memo, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import {
  AtSign,
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  ExternalLink,
  Heart,
  HelpCircle,
  ImageIcon,
  LinkIcon,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  Repeat2,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/LanguageContext";
import { formatMonthYear, t } from "@/i18n";
import { getMediaUrl } from "@/lib/media";

export type ProfileUser = {
  id: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string | null;
  cover_image?: string | null;
  date_joined?: string;
  location?: string;
  website?: string;
  is_verified?: boolean;
  is_private?: boolean;
  is_online?: boolean;
  is_following?: boolean;
  follows_viewer?: boolean;
  mutual_followers?: string[];
  followers_count?: number;
  following_count?: number;
  questions_count?: number;
  answers_count?: number;
};

type SocialTab = "followers" | "following";
type ContentTab = "posts" | "replies" | "media" | "likes";

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function getDisplayName(user?: Partial<ProfileUser> | null) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return fullName || user?.username || "Unknown user";
}

export function getInitial(user?: Partial<ProfileUser> | null) {
  return (user?.first_name?.[0] || user?.username?.[0] || "U").toUpperCase();
}

export function getProfileHref(user: Pick<ProfileUser, "id" | "username">) {
  return `/user/${user.username}`;
}

export function formatJoined(date?: string, lang: "uz" | "en" | "ru" = "uz") {
  if (!date) return "";
  return formatMonthYear(lang, date);
}

export function useDebouncedValue<T>(value: T, delay = 220) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [delay, value]);

  return debounced;
}

function getAuthenticatedUserId() {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Number(payload.user_id ?? payload.id ?? null) || null;
  } catch {
    return null;
  }
}

function CountButton({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="font-semibold tabular-nums text-foreground">{value.toLocaleString()}</span>{" "}
      <span className="text-muted-foreground transition group-hover:text-foreground">{label}</span>
    </motion.button>
  );
}

export function FollowButton({
  user,
  viewerId,
  size = "md",
  context = "default",
  invalidateKeys = [],
}: {
  user: ProfileUser;
  viewerId?: number | null;
  size?: "sm" | "md";
  context?: "default" | "followers" | "following" | "myFollowers" | "myFollowing";
  invalidateKeys?: unknown[][];
}) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { lang } = useLang();
  const [hovered, setHovered] = useState(false);
  const currentUserId = viewerId ?? getAuthenticatedUserId();
  const isSelf = Number(currentUserId) === Number(user.id);
  const isFollowing = Boolean(user.is_following);
  const showDestructive = isFollowing && hovered;
  const isFollowBack = context === "myFollowers" && !isFollowing;

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/users/${user.id}/follow/`);
      return res.json() as Promise<{ following: boolean; followers_count: number }>;
    },
    onMutate: async () => {
      const keys = [[`/api/users/${user.id}`], ...invalidateKeys];
      await Promise.all(keys.map((queryKey) => qc.cancelQueries({ queryKey })));
      const previous = keys.map((queryKey) => [queryKey, qc.getQueryData(queryKey)] as const);

      keys.forEach((queryKey) => {
        qc.setQueryData(queryKey, (current: any) => {
          if (!current) return current;
          if (Array.isArray(current)) {
            return current.map((item) =>
              item.id === user.id ? { ...item, is_following: !isFollowing } : item,
            );
          }
          if (current.id === user.id) {
            return {
              ...current,
              is_following: !isFollowing,
              followers_count: Math.max(0, (current.followers_count || 0) + (isFollowing ? -1 : 1)),
            };
          }
          return current;
        });
      });

      return { previous };
    },
    onSuccess: (data) => {
      toast({
        title: data.following ? t(lang, "profile.toast.followed", { username: user.username }) : t(lang, "profile.toast.unfollowed", { username: user.username }),
      });
    },
    onError: (_error, _vars, contextData) => {
      contextData?.previous.forEach(([queryKey, data]) => qc.setQueryData(queryKey, data));
      toast({ title: t(lang, "profile.toast.followFailed"), description: t(lang, "profile.toast.tryAgain"), variant: "destructive" });
    },
    onSettled: () => {
      [[`/api/users/${user.id}`], ...invalidateKeys].forEach((queryKey) => {
        qc.invalidateQueries({ queryKey });
      });
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      qc.invalidateQueries({ queryKey: ["/api/questions"] });
    },
  });

  if (isSelf || !getAccessToken()) return null;

  const label = mutation.isPending
    ? ""
    : showDestructive
      ? context === "myFollowers"
        ? t(lang, "profile.actions.remove")
        : t(lang, "profile.actions.unfollow")
      : isFollowing
        ? t(lang, "profile.actions.following")
        : isFollowBack
          ? t(lang, "profile.actions.followBack")
          : t(lang, "profile.actions.follow");

  return (
    <motion.div whileHover={{ scale: mutation.isPending ? 1 : 1.03 }} whileTap={{ scale: 0.97 }}>
      <Button
        type="button"
        size={size === "sm" ? "sm" : "default"}
        variant={isFollowing ? "outline" : "default"}
        disabled={mutation.isPending}
        aria-label={`${label || t(lang, "loading")} ${user.username}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onFocus={() => setHovered(true)}
        onBlur={() => setHovered(false)}
        onClick={() => mutation.mutate()}
        className={cn(
          "min-w-[104px] rounded-full px-4 font-semibold shadow-sm transition-all duration-200",
          size === "sm" && "min-w-[92px]",
          !isFollowing && "bg-foreground text-background hover:bg-foreground/90",
          isFollowing && "border-border/80 bg-background/70 hover:border-foreground/20",
          showDestructive && "border-red-500/40 bg-red-500/10 text-red-600 hover:bg-red-500/15 dark:text-red-400",
        )}
      >
        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showDestructive ? (
          <UserMinus className="h-4 w-4" />
        ) : isFollowing ? (
          <Check className="h-4 w-4" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={label}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.14 }}
          >
            {label}
          </motion.span>
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

function ProfilePreview({ user }: { user: ProfileUser }) {
  const { lang } = useLang();
  return (
    <div className="space-y-3">
      <div className="h-20 rounded-md bg-[linear-gradient(135deg,hsl(var(--primary)/.25),hsl(var(--chart-2)/.2),hsl(var(--chart-4)/.18))]">
        {user.cover_image && <img 
        src={getMediaUrl(user.cover_image)} 
        alt="" 
        className="h-full w-full rounded-md object-cover" 
        loading="lazy" 
      />}
      </div>
      <div className="-mt-10 flex items-end gap-3 px-1">
        <Avatar className="h-16 w-16 border-4 border-popover">
          <AvatarImage 
                  src={getMediaUrl(user.avatar)} 
                  loading="lazy" 
                />
          <AvatarFallback>{getInitial(user)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 pb-1">
          <div className="flex items-center gap-1">
            <p className="truncate font-semibold">{getDisplayName(user)}</p>
            {user.is_verified && <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />}
          </div>
          <p className="truncate text-sm text-muted-foreground">@{user.username}</p>
        </div>
      </div>
      {user.bio && <p className="line-clamp-3 text-sm text-muted-foreground">{user.bio}</p>}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span>{t(lang, "profile.stats.following", { count: user.following_count || 0 })}</span>
        <span>{t(lang, "profile.stats.followers", { count: user.followers_count || 0 })}</span>
      </div>
    </div>
  );
}

export const SocialUserCard = memo(function SocialUserCard({
  user,
  viewerId,
  modalOwnerId,
  activeTab,
  isOwnProfile,
  invalidateKeys,
}: {
  user: ProfileUser;
  viewerId?: number | null;
  modalOwnerId: number;
  activeTab: SocialTab;
  isOwnProfile: boolean;
  invalidateKeys: unknown[][];
}) {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const href = getProfileHref(user);
  const context =
    isOwnProfile && activeTab === "followers"
      ? "myFollowers"
      : isOwnProfile && activeTab === "following"
        ? "myFollowing"
        : activeTab;
  const mutual = user.mutual_followers?.slice(0, 2).join(", ");
  const currentUserId = viewerId ?? getAuthenticatedUserId();
  const isSelf = Number(currentUserId) === Number(user.id);

  const navigateToUser = () => navigate(href);

  return (
    <motion.div
      variants={itemVariants}
      layout
      className={cn(
        "group flex items-start gap-3 px-4 py-3 transition hover:bg-muted/45 sm:px-5",
        isSelf && "bg-primary/[0.06] ring-1 ring-inset ring-primary/10",
      )}
    >
      <HoverCard openDelay={250} closeDelay={80}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            onClick={navigateToUser}
            className="relative shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t(lang, "common.a11y.openProfile", { username: user.username })}
          >
            <Avatar className="h-12 w-12 border border-border/70">
              <AvatarImage 
                  src={getMediaUrl(user.avatar)} 
                  loading="lazy" 
                />
              <AvatarFallback>{getInitial(user)}</AvatarFallback>
            </Avatar>
            {user.is_online && <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-emerald-500" />}
          </button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80 rounded-lg p-3">
          <ProfilePreview user={user} />
        </HoverCardContent>
      </HoverCard>

      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={navigateToUser}
          className="block max-w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex items-center gap-1">
            <span className="truncate text-sm font-semibold leading-5 group-hover:underline">{getDisplayName(user)}</span>
            {user.is_verified && <BadgeCheck className="h-4 w-4 shrink-0 fill-primary text-primary-foreground" />}
            {user.is_private && <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />}
            {isSelf && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">{t(lang, "profile.labels.you")}</span>}
          </span>
          <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
        </button>
        {user.bio && <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">{user.bio}</p>}
        {mutual && (
          <p className="mt-1 text-xs text-muted-foreground">
            {user.mutual_followers && user.mutual_followers.length > 2
              ? t(lang, "common.search.followedByOthers", { names: mutual })
              : t(lang, "common.search.followedBy", { names: mutual })}
          </p>
        )}
        {user.follows_viewer && user.id !== modalOwnerId && (
          <span className="mt-2 inline-flex rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">{t(lang, "profile.labels.followsYou")}</span>
        )}
      </div>

      {isSelf ? (
        <span className="rounded-full border border-primary/15 bg-primary/[0.08] px-3 py-1 text-xs font-semibold text-primary">{t(lang, "profile.labels.you")}</span>
      ) : (
        <FollowButton
          user={user}
          viewerId={currentUserId}
          size="sm"
          context={context as any}
          invalidateKeys={invalidateKeys}
        />
      )}
    </motion.div>
  );
});

function SocialListSkeleton() {
  return (
    <div className="divide-y divide-border/60">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 px-5 py-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function useSocialUsers(ownerId?: number, activeTab?: SocialTab, query = "", open = false) {
  const debounced = useDebouncedValue(query.trim().toLowerCase(), 220);
  const endpoint = `/api/users/${ownerId}/${activeTab}/`;

  const queryResult = useQuery<ProfileUser[]>({
    queryKey: [`/api/users/${ownerId}/${activeTab}`],
    queryFn: async () => {
      const headers: Record<string, string> = {};
      const token = getAccessToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error("Unable to load users");
      return res.json();
    },
    enabled: Boolean(ownerId && activeTab && open),
  });

  const filtered = useMemo(() => {
    const users = queryResult.data || [];
    if (!debounced) return users;
    return users.filter((user) => {
      const searchable = `${getDisplayName(user)} ${user.username} ${user.bio || ""}`.toLowerCase();
      return searchable.includes(debounced);
    });
  }, [debounced, queryResult.data]);

  return { ...queryResult, users: filtered };
}

export function FollowersModal({
  open,
  onOpenChange,
  owner,
  initialTab,
  viewerId,
  isOwnProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: ProfileUser;
  initialTab: SocialTab;
  viewerId?: number | null;
  isOwnProfile: boolean;
}) {
  const isMobile = useIsMobile();
  const { lang } = useLang();
  const [activeTab, setActiveTab] = useState<SocialTab>(initialTab);
  const [query, setQuery] = useState("");
  const { users, isLoading, isError } = useSocialUsers(owner.id, activeTab, query, open);
  const invalidateKeys = [
    [`/api/users/${owner.id}/followers`],
    [`/api/users/${owner.id}/following`],
    [`/api/users/${owner.id}`],
  ];

  useEffect(() => {
    if (open) {
      setActiveTab(initialTab);
      setQuery("");
    }
  }, [initialTab, open]);

  const modalBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative grid grid-cols-2 border-b border-border/70">
        {(["followers", "following"] as SocialTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "relative h-12 text-sm font-semibold capitalize transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(lang, tab === "followers" ? "profile.modal.followers" : "profile.modal.following")}
            {activeTab === tab && (
              <motion.span
                layoutId="social-tab-indicator"
                className="absolute inset-x-8 bottom-0 h-0.5 rounded-full bg-foreground"
                transition={{ type: "spring", stiffness: 430, damping: 34 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="border-b border-border/70 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t(lang, "profile.modal.search", { tab: t(lang, activeTab === "followers" ? "profile.modal.followers" : "profile.modal.following") })}
            aria-label={t(lang, "profile.modal.search", { tab: t(lang, activeTab === "followers" ? "profile.modal.followers" : "profile.modal.following") })}
            className="h-10 rounded-full bg-muted/60 pl-9"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        {isLoading ? (
          <SocialListSkeleton />
        ) : isError ? (
          <div className="grid min-h-60 place-items-center px-6 text-center">
            <div>
              <ShieldCheck className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-semibold">{t(lang, "profile.modal.couldNotLoad", { tab: t(lang, activeTab === "followers" ? "profile.modal.followers" : "profile.modal.following") })}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t(lang, "profile.modal.refresh")}</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="grid min-h-60 place-items-center px-6 text-center">
            <div>
              <Users className="mx-auto mb-3 h-9 w-9 text-muted-foreground" />
              <p className="font-semibold">{query ? t(lang, "profile.modal.noMatchingPeople") : t(lang, "profile.modal.noPeopleYet", { tab: t(lang, activeTab === "followers" ? "profile.modal.followers" : "profile.modal.following") })}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {query ? t(lang, "profile.modal.tryDifferent") : t(lang, "profile.modal.emptySocial")}
              </p>
            </div>
          </div>
        ) : (
          <motion.div initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.035 } } }} className="divide-y divide-border/60">
            {users.map((user) => (
              <SocialUserCard
                key={user.id}
                user={user}
                viewerId={viewerId}
                modalOwnerId={owner.id}
                activeTab={activeTab}
                isOwnProfile={isOwnProfile}
                invalidateKeys={invalidateKeys}
              />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92dvh] rounded-t-2xl border-border/80">
          <DrawerHeader className="border-b border-border/70 px-5 text-left">
            <DrawerTitle className="flex items-center gap-2">
              {getDisplayName(owner)}
              {owner.is_verified && <BadgeCheck className="h-5 w-5 fill-primary text-primary-foreground" />}
            </DrawerTitle>
          </DrawerHeader>
          {modalBody}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="h-[min(720px,86vh)] max-w-xl gap-0 overflow-hidden rounded-2xl border-border/80 bg-background/95 p-0 shadow-2xl backdrop-blur-xl">
        <DialogHeader className="border-b border-border/70 p-5 pb-4">
          <DialogTitle className="flex items-center gap-2">
            {getDisplayName(owner)}
            {owner.is_verified && <BadgeCheck className="h-5 w-5 fill-primary text-primary-foreground" />}
          </DialogTitle>
        </DialogHeader>
        {modalBody}
      </DialogContent>
    </Dialog>
  );
}

export function ProfileHeader({
  user,
  viewerId,
  isOwnProfile,
  onOpenSocial,
  onEditProfile,
  onAvatarChange,
  onCoverChange,
}: {
  user: ProfileUser;
  viewerId?: number | null;
  isOwnProfile: boolean;
  onOpenSocial: (tab: SocialTab) => void;
  onEditProfile?: () => void;
  onAvatarChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCoverChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const { lang } = useLang();
  const joinedDate = formatJoined(user.date_joined, lang);
  const postsCount = user.questions_count || 0;
  const website = user.website?.replace(/^https?:\/\//, "");

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-none border-b border-border/70 bg-card sm:rounded-2xl sm:border sm:shadow-sm"
    >
      <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,hsl(var(--primary)/.34),hsl(var(--chart-2)/.22)_45%,hsl(var(--chart-4)/.22))] sm:h-56">
        {user.cover_image && (
          <motion.img
            src={user.cover_image}
            alt=""
            initial={{ scale: 1.04 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.55 }}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
        {isOwnProfile && onCoverChange && (
          <Tooltip>
            <TooltipTrigger asChild>
              <label className="absolute bottom-4 right-4 inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-lg backdrop-blur transition hover:bg-black/60">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={onCoverChange} />
              </label>
            </TooltipTrigger>
            <TooltipContent>{t(lang, "profile.actions.changeCover")}</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-14 flex items-end justify-between gap-3 sm:-mt-16">
          <div className="relative">
            <motion.div whileHover={{ scale: 1.02 }} className="rounded-full">
              <Avatar className="h-28 w-28 border-4 border-card bg-card shadow-xl sm:h-32 sm:w-32">
                <AvatarImage 
                  src={getMediaUrl(user.avatar)} 
                  loading="lazy" 
                />
                <AvatarFallback className="text-4xl font-bold">{getInitial(user)}</AvatarFallback>
              </Avatar>
            </motion.div>
            {user.is_online && <span className="absolute bottom-3 right-3 h-4 w-4 rounded-full border-2 border-card bg-emerald-500" />}
            {isOwnProfile && onAvatarChange && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <label className="absolute bottom-1 right-1 inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-foreground text-background shadow-md transition hover:scale-105">
                    <Camera className="h-4 w-4" />
                    <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                  </label>
                </TooltipTrigger>
                <TooltipContent>{t(lang, "profile.actions.changeAvatar")}</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="mb-2 flex items-center gap-2">
            {isOwnProfile ? (
              <Button variant="outline" className="rounded-full px-5 font-semibold" onClick={onEditProfile}>
                {t(lang, "profile.actions.editProfile")}
              </Button>
            ) : (
              <>
                <Button variant="outline" className="rounded-full px-4 font-semibold">
                  <MessageCircle className="h-4 w-4" />
                  {t(lang, "profile.actions.message")}
                </Button>
                <FollowButton
                  user={user}
                  viewerId={viewerId}
                  invalidateKeys={[[`/api/users/${user.id}/followers`], [`/api/users/${user.id}/following`]]}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{getDisplayName(user)}</h1>
              {user.is_verified && <BadgeCheck className="h-5 w-5 shrink-0 fill-primary text-primary-foreground" />}
              {user.is_private && <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />}
            </div>
            <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
              <AtSign className="h-3.5 w-3.5" />
              {user.username}
            </p>
          </div>

          {user.bio && <p className="max-w-2xl whitespace-pre-wrap break-words text-[15px] leading-6 [word-break:break-word]">{user.bio}</p>}

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {user.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {user.location}
              </span>
            )}
            {website && (
              <a className="inline-flex items-center gap-1.5 text-primary hover:underline" href={user.website?.startsWith("http") ? user.website : `https://${user.website}`} target="_blank" rel="noreferrer">
                <LinkIcon className="h-4 w-4" />
                {website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {joinedDate && (
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                {t(lang, "profile.labels.joined", { date: joinedDate })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            <CountButton label={t(lang, "profile.stats.posts", { count: postsCount }).replace(String(postsCount), "").trim()} value={postsCount} />
            <CountButton label={t(lang, "profile.stats.following", { count: user.following_count || 0 }).replace(String(user.following_count || 0), "").trim()} value={user.following_count || 0} onClick={() => onOpenSocial("following")} />
            <CountButton label={t(lang, "profile.stats.followers", { count: user.followers_count || 0 }).replace(String(user.followers_count || 0), "").trim()} value={user.followers_count || 0} onClick={() => onOpenSocial("followers")} />
          </div>
        </div>
      </div>
    </motion.section>
  );
}

export function ProfileTabs({
  activeTab,
  onChange,
  counts,
  isOwnProfile = true,
}: {
  activeTab: ContentTab;
  onChange: (tab: ContentTab) => void;
  counts: Record<ContentTab, number>;
  isOwnProfile?: boolean;
}) {
  const { lang } = useLang();
  const allTabs: { id: ContentTab; label: string; icon: React.ElementType }[] = [
    { id: "posts", label: t(lang, "profile.tabs.posts"), icon: HelpCircle },
    { id: "likes", label: t(lang, "profile.tabs.likes"), icon: Heart },
  ];
  const tabs = allTabs.filter((tab) => isOwnProfile || tab.id === "posts");

  return (
    <div className="sticky top-0 z-20 border-b border-border/70 bg-background/88 backdrop-blur-xl sm:top-3 sm:rounded-xl sm:border sm:shadow-sm">
      <div className={cn("grid", tabs.length === 1 ? "grid-cols-1" : tabs.length === 2 ? "grid-cols-2" : "grid-cols-4")}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                "relative flex h-14 items-center justify-center gap-2 px-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                activeTab === tab.id ? "text-foreground" : "text-muted-foreground hover:bg-muted/55 hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="text-xs tabular-nums text-muted-foreground">{counts[tab.id]}</span>
              {activeTab === tab.id && (
                <motion.span
                  layoutId="profile-content-tab"
                  className="absolute bottom-0 h-0.5 w-12 rounded-full bg-foreground"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ProfileEmptyState({
  tab,
  isOwnProfile,
}: {
  tab: ContentTab;
  isOwnProfile: boolean;
}) {
  const { lang } = useLang();
  const copy: Record<ContentTab, { title: string; body: string; icon: React.ElementType }> = {
    posts: {
      title: isOwnProfile ? t(lang, "profile.empty.postsTitleOwn") : t(lang, "profile.empty.postsTitleOther"),
      body: isOwnProfile ? t(lang, "profile.empty.postsBodyOwn") : t(lang, "profile.empty.postsBodyOther"),
      icon: HelpCircle,
    },
    replies: {
      title: t(lang, "profile.empty.repliesTitle"),
      body: isOwnProfile ? t(lang, "profile.empty.repliesBodyOwn") : t(lang, "profile.empty.repliesBodyOther"),
      icon: MessageCircle,
    },
    media: {
      title: t(lang, "profile.empty.mediaTitle"),
      body: t(lang, "profile.empty.mediaBody"),
      icon: ImageIcon,
    },
    likes: {
      title: t(lang, "profile.empty.likesTitle"),
      body: isOwnProfile ? t(lang, "profile.empty.likesBodyOwn") : t(lang, "profile.empty.likesBodyOther"),
      icon: Heart,
    },
  };
  const Icon = copy[tab].icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid min-h-72 place-items-center border-b border-border/70 bg-card/45 px-6 text-center sm:rounded-xl sm:border"
    >
      <div className="max-w-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Icon className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-bold">{copy[tab].title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy[tab].body}</p>
      </div>
    </motion.div>
  );
}

export function RepostTabIcon() {
  return <Repeat2 className="h-4 w-4" />;
}
