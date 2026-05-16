import { useEffect, useMemo, useState } from "react";
import { useLocation, useParams } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionCard } from "@/components/QuestionCard";
import {
  FollowersModal,
  ProfileEmptyState,
  ProfileHeader,
  ProfileTabs,
  ProfileUser,
} from "@/components/profile/ProfileSocial";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { readSocialState } from "@/lib/socialState";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

type SocialTab = "followers" | "following";
type ContentTab = "posts" | "replies" | "media" | "likes";

function currentUserIdFromToken() {
  try {
    const token = getAccessToken();
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]))?.user_id ?? null;
  } catch {
    return null;
  }
}

export function UserProfile() {
  const params = useParams<{ id?: string; username?: string }>();
  const { lang } = useLang();
  const [, navigate] = useLocation();
  const identifier = params.id || params.username || "";
  const [socialModal, setSocialModal] = useState<SocialTab | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>("posts");
  const viewerId = currentUserIdFromToken();

  const { data: profile } = useQuery<ProfileUser | null>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile/");
      return res.json();
    },
    enabled: !!getAccessToken(),
  });

  const { data: user, isLoading, isError } = useQuery<ProfileUser>({
    queryKey: [`/api/users/${identifier}`],
    queryFn: async () => {
      const token = getAccessToken();
      const headers: Record<string, string> = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      const endpoint = /^\d+$/.test(identifier)
        ? `/api/users/${identifier}/`
        : `/api/users/by-username/${encodeURIComponent(identifier)}/`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error("User not found");
      return res.json();
    },
    enabled: Boolean(identifier),
  });

  const { data: questions = [] } = useQuery<any[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const res = await fetch("/api/questions/");
      if (!res.ok) throw new Error("Could not load posts");
      return res.json();
    },
  });

  const userQuestions = useMemo(() => {
    const pinnedIds = new Set(readSocialState().pinnedPostIds);
    const originals = questions
      .filter((question: any) => question.author?.id === user?.id)
      .map((question: any) => ({ ...question, timeline_id: `post-${question.id}`, _sortDate: question.created_at }));
    return originals.sort((a: any, b: any) => {
      const pinnedDelta = Number(pinnedIds.has(b.id)) - Number(pinnedIds.has(a.id));
      if (pinnedDelta !== 0) return pinnedDelta;
      return new Date(b._sortDate || b.created_at).getTime() - new Date(a._sortDate || a.created_at).getTime();
    });
  }, [questions, user?.id]);

  const { data: reposts = [] } = useQuery<any[]>({
    queryKey: ["/api/reposts", user?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/reposts/?user_id=${user?.id}`);
      return res.json();
    },
    enabled: !!user?.id && !!getAccessToken(),
  });

  const userTimeline = useMemo(
    () =>
      [...userQuestions, ...reposts.map((repost: any) => ({ ...repost, _sortDate: repost.reposted_at }))].sort(
        (a: any, b: any) => new Date(b._sortDate || b.created_at).getTime() - new Date(a._sortDate || a.created_at).getTime(),
      ),
    [reposts, userQuestions],
  );

  const likedQuestions = useMemo(
    () => questions.filter((question: any) => localStorage.getItem(`liked_question_${question.id}`) === "true"),
    [questions],
  );

  const visibleQuestions = activeTab === "likes" ? likedQuestions : activeTab === "posts" ? userTimeline : [];
  const isOwnProfile = Boolean(user?.id && (viewerId === user.id || profile?.id === user.id));

  useEffect(() => {
    if (isOwnProfile) navigate("/profile");
  }, [isOwnProfile, navigate]);

  useEffect(() => {
    if (!isOwnProfile && activeTab !== "posts") setActiveTab("posts");
  }, [activeTab, isOwnProfile]);

  if (isLoading) {
    return (
      <div className="grid min-h-[55vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="mx-auto grid min-h-[55vh] max-w-xl place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">{t(lang, "profile.empty.userNotFound")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t(lang, "profile.empty.userNotFoundDescription")}</p>
          <Button className="mt-5 rounded-full" onClick={() => navigate("/")}>{t(lang, "common.actions.goHome")}</Button>
        </div>
      </div>
    );
  }

  if (isOwnProfile) {
    return null;
  }

  return (
    <div className="mx-auto max-w-3xl pb-10 sm:px-4 sm:pt-4">
      <div className="sticky top-0 z-30 flex h-12 items-center gap-2 border-b border-border/70 bg-background/90 px-2 backdrop-blur-xl sm:top-3 sm:mb-3 sm:rounded-xl sm:border">
        <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate("/")}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">{t(lang, "common.actions.back")}</span>
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold">{[user.first_name, user.last_name].filter(Boolean).join(" ") || user.username}</p>
          <p className="text-xs text-muted-foreground">{t(lang, "profile.stats.posts", { count: userTimeline.length })}</p>
        </div>
      </div>

      <div className="space-y-4">
        <ProfileHeader
          user={{ ...user, questions_count: userTimeline.length }}
          viewerId={viewerId}
          isOwnProfile={false}
          onOpenSocial={setSocialModal}
        />

        <ProfileTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          isOwnProfile={false}
          counts={{
            posts: userTimeline.length,
            replies: user.answers_count || 0,
            media: 0,
            likes: likedQuestions.length,
          }}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="space-y-3"
          >
            {visibleQuestions.length === 0 ? (
              <ProfileEmptyState tab={activeTab} isOwnProfile={false} />
            ) : (
              visibleQuestions.map((question: any) => (
                <QuestionCard
                  key={question.timeline_id || `post-${question.id}`}
                  id={question.id}
                  description={question.description}
                  author={question.author}
                  authorAvatar={question.author?.avatar}
                  created_at={question.created_at}
                  tags={question.tags}
                  answers={question.answers || []}
                  likes_count={question.likes_count || 0}
                  upvotes={question.likes_count || 0}
                  previewLength={280}
                  currentUserId={profile?.id}
                />
              ))
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <FollowersModal
        open={socialModal !== null}
        onOpenChange={(open) => !open && setSocialModal(null)}
        owner={user}
        initialTab={socialModal || "followers"}
        viewerId={viewerId}
        isOwnProfile={false}
      />
    </div>
  );
}
