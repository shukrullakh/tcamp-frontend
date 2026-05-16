import { useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { BarChart3, Loader2, Mail, MapPin, Save, Settings, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuestionCard } from "@/components/QuestionCard";
import {
  FollowersModal,
  ProfileEmptyState,
  ProfileHeader,
  ProfileTabs,
  ProfileUser,
} from "@/components/profile/ProfileSocial";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { readSocialState } from "@/lib/socialState";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

type SocialTab = "followers" | "following";
type ContentTab = "posts" | "replies" | "media" | "likes";

function getCroppedBlob(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available");
  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height,
  );
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not crop image"))), "image/jpeg", 0.9);
  });
}

export function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { lang } = useLang();
  const qc = useQueryClient();
  const imgRef = useRef<HTMLImageElement>(null);
  const [socialModal, setSocialModal] = useState<SocialTab | null>(null);
  const [activeTab, setActiveTab] = useState<ContentTab>("posts");
  const [editMode, setEditMode] = useState(false);
  const [showCrop, setShowCrop] = useState(false);
  const [srcImage, setSrcImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: "%", width: 80, height: 80, x: 10, y: 10 });
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    bio: "",
    location: "",
    website: "",
  });

  const { data: profile, isLoading } = useQuery<ProfileUser>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile/");
      const data = await res.json();
      setForm({
        first_name: data.first_name || "",
        last_name: data.last_name || "",
        email: data.email || "",
        bio: data.bio || "",
        location: data.location || "",
        website: data.website || "",
      });
      return data;
    },
    enabled: !!getAccessToken(),
  });

  const { data: userDetail } = useQuery<ProfileUser>({
    queryKey: [`/api/users/${profile?.id}`],
    enabled: !!profile?.id,
  });

  const { data: questions = [] } = useQuery<any[]>({
    queryKey: ["/api/questions"],
    queryFn: async () => {
      const res = await fetch("/api/questions/");
      if (!res.ok) throw new Error("Could not load posts");
      return res.json();
    },
  });

  const { data: answers = [] } = useQuery<any[]>({
    queryKey: ["/api/answers"],
    queryFn: async () => {
      const res = await fetch("/api/answers/");
      if (!res.ok) throw new Error("Could not load replies");
      return res.json();
    },
  });

  const { data: reposts = [] } = useQuery<any[]>({
    queryKey: ["/api/reposts", profile?.id],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/reposts/?user_id=${profile?.id}`);
      return res.json();
    },
    enabled: !!profile?.id,
  });

  const updateProfile = useMutation({
    mutationFn: async (formData: FormData) => {
      const token = getAccessToken();
      const res = await fetch("/api/profile/", {
        method: "PATCH",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) throw new Error("Profile update failed");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: t(lang, "profile.toast.updated") });
      qc.setQueryData(["/api/profile"], data);
      qc.invalidateQueries({ queryKey: ["/api/profile"] });
      qc.invalidateQueries({ queryKey: [`/api/users/${profile?.id}`] });
      setShowCrop(false);
      setSrcImage(null);
      setEditMode(false);
    },
    onError: () => toast({ title: t(lang, "profile.toast.updateFailed"), variant: "destructive" }),
  });

  const viewer = userDetail || profile;

  const myQuestions = useMemo(() => {
    const pinnedIds = new Set(readSocialState().pinnedPostIds);
    const originals = questions
      .filter((question: any) => question.author?.id === profile?.id)
      .map((question: any) => ({ ...question, timeline_id: `post-${question.id}`, _sortDate: question.created_at }));
    const repostItems = reposts.map((repost: any) => ({ ...repost, _sortDate: repost.reposted_at }));
    return [...originals, ...repostItems].sort((a: any, b: any) => {
      const pinnedDelta = Number(pinnedIds.has(b.id) && !b.is_repost) - Number(pinnedIds.has(a.id) && !a.is_repost);
      if (pinnedDelta !== 0) return pinnedDelta;
      return new Date(b._sortDate || b.created_at).getTime() - new Date(a._sortDate || a.created_at).getTime();
    });
  }, [profile?.id, questions, reposts]);

  const myAnswers = useMemo(() => answers.filter((answer: any) => answer.author?.id === profile?.id), [answers, profile?.id]);

  const likedQuestions = useMemo(
    () => questions.filter((question: any) => localStorage.getItem(`liked_question_${question.id}`) === "true"),
    [questions],
  );

  const visibleQuestions = activeTab === "likes" ? likedQuestions : activeTab === "posts" ? myQuestions : [];

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSrcImage(reader.result as string);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCoverChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("cover_image", file);
    await updateProfile.mutateAsync(formData);
  };

  const handleSaveAvatar = async () => {
    if (!completedCrop || !imgRef.current) return;
    const blob = await getCroppedBlob(imgRef.current, completedCrop);
    const formData = new FormData();
    formData.append("avatar", blob, "avatar.jpg");
    await updateProfile.mutateAsync(formData);
  };

  const handleSaveInfo = async () => {
    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    await updateProfile.mutateAsync(formData);
  };

  if (!getAccessToken()) {
    navigate("/login");
    return null;
  }

  if (isLoading || !viewer) {
    return (
      <div className="grid min-h-[55vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-10 sm:px-4 sm:pt-4">
      <div className="space-y-4">
        <ProfileHeader
          user={{ ...(userDetail || profile), questions_count: myQuestions.length, answers_count: myAnswers.length }}
          viewerId={profile?.id}
          isOwnProfile
          onOpenSocial={setSocialModal}
          onEditProfile={() => setEditMode(true)}
          onAvatarChange={handleFileChange}
          onCoverChange={handleCoverChange}
        />

        <ProfileTabs
          activeTab={activeTab}
          onChange={setActiveTab}
          isOwnProfile
          counts={{
            posts: myQuestions.length,
            replies: 0,
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
              <ProfileEmptyState tab={activeTab} isOwnProfile />
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

      <Dialog open={editMode} onOpenChange={setEditMode}>
        <DialogContent className="max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t(lang, "profile.actions.editProfile")}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t(lang, "profile.fields.firstName")}</Label>
                <Input value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} placeholder={viewer.first_name} />
              </div>
              <div className="space-y-2">
                <Label>{t(lang, "profile.fields.lastName")}</Label>
                <Input value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} placeholder={viewer.last_name} />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Mail className="h-4 w-4" />{t(lang, "profile.fields.email")}</Label>
              <Input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder={viewer.email} />
            </div>
            <div className="space-y-2">
              <Label>{t(lang, "profile.fields.bio")}</Label>
              <Textarea
                value={form.bio}
                onChange={(event) => setForm({ ...form, bio: event.target.value })}
                className="min-h-28 resize-none"
                maxLength={280}
              />
              <p className="text-right text-xs text-muted-foreground">{form.bio.length}/280</p>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" />{t(lang, "profile.fields.location")}</Label>
                <Input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} placeholder={viewer.location} />
              </div>
              <div className="space-y-2">
                <Label>{t(lang, "profile.fields.website")}</Label>
                <Input value={form.website} onChange={(event) => setForm({ ...form, website: event.target.value })} placeholder={viewer.website} />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" className="rounded-full cursor-pointer" onClick={() => setEditMode(false)}>
                <X className="h-4 w-4" />
                {t(lang, "cancel")}
              </Button>
              <Button className="rounded-full cursor-pointer" disabled={updateProfile.isPending} onClick={handleSaveInfo}>
                {updateProfile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {t(lang, "profile.actions.saveProfile")}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCrop} onOpenChange={(open) => !open && setShowCrop(false)}>
        <DialogContent className="max-w-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle>{t(lang, "profile.actions.cropAvatar")}</DialogTitle>
          </DialogHeader>
          {srcImage && (
            <div className="space-y-4">
              <div className="flex justify-center rounded-xl bg-muted/40 p-3">
                <ReactCrop crop={crop} onChange={(nextCrop) => setCrop(nextCrop)} onComplete={(nextCrop) => setCompletedCrop(nextCrop)} aspect={1} circularCrop>
                  <img ref={imgRef} src={srcImage} alt="Crop avatar preview" className="max-h-[420px] max-w-full rounded-lg" />
                </ReactCrop>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" className="rounded-full cursor-pointer" onClick={() => setShowCrop(false)}>{t(lang, "cancel")}</Button>
                <Button className="rounded-full cursor-pointer" disabled={updateProfile.isPending || !completedCrop} onClick={handleSaveAvatar}>
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t(lang, "profile.actions.saveAvatar")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <FollowersModal
        open={socialModal !== null}
        onOpenChange={(open) => !open && setSocialModal(null)}
        owner={viewer}
        initialTab={socialModal || "followers"}
        viewerId={profile?.id}
        isOwnProfile
      />
    </div>
  );
}
