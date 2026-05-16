import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BadgeCheck, RefreshCw, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { FollowButton, ProfileUser, getDisplayName, getInitial } from "@/components/profile/ProfileSocial";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

export function SuggestedUsers({ viewerId }: { viewerId?: number }) {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { lang } = useLang();

  const { data: suggested = [], isFetching } = useQuery<(ProfileUser & { recommendation_reason?: string })[]>({
    queryKey: ["/api/users/suggested"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/users/suggested/");
      return res.json();
    },
    enabled: !!getAccessToken(),
    staleTime: 45_000,
  });

  if (!getAccessToken() || suggested.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-background/75 p-4 shadow-sm backdrop-blur-xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <Sparkles className="h-4 w-4 text-primary" />
            {t(lang, "profile.labels.suggestedForYou")}
          </h2>
          <p className="text-xs text-muted-foreground">{t(lang, "profile.labels.suggestedDescription")}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full cursor-pointer"
          disabled={isFetching}
          onClick={() => qc.invalidateQueries({ queryKey: ["/api/users/suggested"] })}
          aria-label={t(lang, "profile.labels.refreshSuggested")}
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="flex snap-x gap-3 overflow-x-auto pb-1">
        {suggested.map((user, index) => (
          <motion.article
            key={user.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.035 }}
            className="min-w-[240px] snap-start rounded-2xl border border-border/70 bg-card/70 p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <button type="button" onClick={() => navigate(`/profile/${user.username}`)} className="flex w-full items-start gap-3 text-left">
              <Avatar className="h-12 w-12 border border-border/70">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{getInitial(user)}</AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1">
                  <span className="truncate text-sm font-bold">{getDisplayName(user)}</span>
                  {user.is_verified && <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />}
                </span>
                <span className="block truncate text-xs text-muted-foreground">@{user.username}</span>
              </span>
            </button>
            {user.bio && <p className="mt-3 line-clamp-2 min-h-10 text-sm text-muted-foreground">{user.bio}</p>}
            <p className="mt-2 text-xs text-muted-foreground">
              {user.mutual_followers?.length ? t(lang, "common.search.followedBy", { names: user.mutual_followers.slice(0, 2).join(", ") }) : user.recommendation_reason}
            </p>
            <div className="mt-4">
              <FollowButton user={user} viewerId={viewerId} size="sm" invalidateKeys={[[`/api/users/suggested`]]} />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
