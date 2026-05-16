import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, MessageSquare, HelpCircle, ThumbsUp,
  Monitor, Mail, TrendingUp, Trash2, ShieldCheck,
  ShieldOff, UserCheck, UserX, CheckCheck
} from "lucide-react";
import { useLang } from "@/components/LanguageContext";
import { languages, t } from "@/i18n";

function StatCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminPanel() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const qc = useQueryClient();

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile/");
      return res.json();
    },
    enabled: !!getAccessToken(),
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/admin-panel/stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin-panel/stats/");
      return res.json();
    },
    enabled: !!profile?.is_staff,
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ["/api/admin-panel/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin-panel/users/");
      return res.json();
    },
    enabled: !!profile?.is_staff,
  });

  const { data: questions = [] } = useQuery<any[]>({
    queryKey: ["/api/admin-panel/questions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin-panel/questions/");
      return res.json();
    },
    enabled: !!profile?.is_staff,
  });

  const { data: messages = [] } = useQuery<any[]>({
    queryKey: ["/api/admin-panel/messages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin-panel/messages/");
      return res.json();
    },
    enabled: !!profile?.is_staff,
  });

  const toggleUser = useMutation({
    mutationFn: async ({ userId, field, value }: any) => {
      await apiRequest("PATCH", `/api/admin-panel/users/${userId}/`, { [field]: value });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin-panel/users"] }),
  });

  const deleteQuestion = useMutation({
    mutationFn: async (questionId: number) => {
      await apiRequest("DELETE", `/api/admin-panel/questions/${questionId}/`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin-panel/questions"] }),
  });

  const markMessageRead = useMutation({
    mutationFn: async (messageId: number) => {
      await apiRequest("PATCH", `/api/admin-panel/messages/${messageId}/`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["/api/admin-panel/messages"] }),
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString(languages[lang].locale);

  if (!profile) return <div className="text-center py-20 text-muted-foreground">{t(lang, "loading")}</div>;
  if (!profile.is_staff) {
    navigate("/");
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto py-8 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t(lang, "common.admin.title")}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t(lang, "common.admin.description")}</p>
        </div>
        <Badge variant="secondary" className="bg-primary/10 text-primary px-3 py-1">
          <ShieldCheck className="w-3.5 h-3.5 mr-1" />
          Admin
        </Badge>
      </div>

      <Tabs defaultValue="stats">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="stats">
            <TrendingUp className="w-4 h-4 mr-2" />
            {t(lang, "common.admin.statistics")}
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-2" />
            {t(lang, "common.admin.users")}
          </TabsTrigger>
          <TabsTrigger value="questions">
            <HelpCircle className="w-4 h-4 mr-2" />
            {t(lang, "common.admin.questions")}
          </TabsTrigger>
          <TabsTrigger value="messages">
            <Mail className="w-4 h-4 mr-2" />
            {t(lang, "common.admin.messages")}
            {messages.filter((m: any) => !m.is_read).length > 0 && (
              <Badge className="ml-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                {messages.filter((m: any) => !m.is_read).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Statistika */}
        <TabsContent value="stats" className="mt-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard
              title={t(lang, "common.admin.totalUsers")}
              value={stats?.users?.total ?? 0}
              sub={t(lang, "common.admin.thisWeek", { count: stats?.users?.this_week ?? 0 })}
              icon={Users}
              color="bg-blue-100 text-blue-600 dark:bg-blue-900/30"
            />
            <StatCard
              title={t(lang, "common.admin.totalQuestions")}
              value={stats?.questions?.total ?? 0}
              sub={t(lang, "common.admin.thisWeek", { count: stats?.questions?.this_week ?? 0 })}
              icon={HelpCircle}
              color="bg-violet-100 text-violet-600 dark:bg-violet-900/30"
            />
            <StatCard
              title={t(lang, "common.admin.totalAnswers")}
              value={stats?.answers?.total ?? 0}
              sub={t(lang, "common.admin.thisWeek", { count: stats?.answers?.this_week ?? 0 })}
              icon={MessageSquare}
              color="bg-green-100 text-green-600 dark:bg-green-900/30"
            />
            <StatCard
              title={t(lang, "common.admin.totalLikes")}
              value={stats?.likes?.total ?? 0}
              icon={ThumbsUp}
              color="bg-rose-100 text-rose-600 dark:bg-rose-900/30"
            />
            <StatCard
              title={t(lang, "common.admin.activeSessions")}
              value={stats?.sessions?.active ?? 0}
              icon={Monitor}
              color="bg-orange-100 text-orange-600 dark:bg-orange-900/30"
            />
            <StatCard
              title={t(lang, "common.admin.messages")}
              value={stats?.messages?.total ?? 0}
              sub={t(lang, "common.admin.unread", { count: stats?.messages?.unread ?? 0 })}
              icon={Mail}
              color="bg-teal-100 text-teal-600 dark:bg-teal-900/30"
            />
          </div>
        </TabsContent>

        {/* Foydalanuvchilar */}
        <TabsContent value="users" className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">{t(lang, "common.admin.userCount", { count: users.length })}</p>
          {users.map((user: any) => (
            <Card key={user.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{user.first_name ? `${user.first_name} ${user.last_name}` : user.username}</span>
                        <span className="text-xs text-muted-foreground">@{user.username}</span>
                        {user.is_staff && <Badge className="text-[10px] px-1.5 py-0 bg-primary/10 text-primary">{t(lang, "common.admin.title")}</Badge>}
                        {!user.is_active && <Badge variant="destructive" className="text-[10px] px-1.5 py-0">{t(lang, "common.admin.blocked")}</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground">{user.email} - {t(lang, "common.admin.questionCount", { count: user.questions_count })} - {t(lang, "common.admin.answerCount", { count: user.answers_count })} - {formatDate(user.date_joined)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => toggleUser.mutate({ userId: user.id, field: 'is_active', value: !user.is_active })}
                    >
                      {user.is_active ? <><UserX className="w-3 h-3 mr-1" />{t(lang, "common.admin.block")}</> : <><UserCheck className="w-3 h-3 mr-1" />{t(lang, "common.admin.activate")}</>}
                    </Button>
                    {user.id !== profile?.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => toggleUser.mutate({ userId: user.id, field: 'is_staff', value: !user.is_staff })}
                      >
                        {user.is_staff ? <><ShieldOff className="w-3 h-3 mr-1" />{t(lang, "common.admin.removeAdmin")}</> : <><ShieldCheck className="w-3 h-3 mr-1" />{t(lang, "common.admin.makeAdmin")}</>}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Savollar */}
        <TabsContent value="questions" className="mt-6 space-y-3">
          <p className="text-sm text-muted-foreground">{t(lang, "common.admin.questionCount", { count: questions.length })}</p>
          {questions.map((q: any) => (
            <Card key={q.id}>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{q.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      @{q.author} - {t(lang, "common.admin.answerCount", { count: q.answers_count })} - {t(lang, "common.admin.likeCount", { count: q.likes_count })} - {formatDate(q.created_at)}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 flex-shrink-0"
                    onClick={() => deleteQuestion.mutate(q.id)}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {t(lang, "delete")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Xabarlar */}
        <TabsContent value="messages" className="mt-6">
          {selectedMessage ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => setSelectedMessage(null)}>
                    {t(lang, "common.admin.back")}
                  </Button>
                  {!selectedMessage.is_read && (
                    <Button size="sm" variant="outline" className="h-7 text-xs"
                      onClick={() => { markMessageRead.mutate(selectedMessage.id); setSelectedMessage({ ...selectedMessage, is_read: true }); }}>
                      <CheckCheck className="w-3 h-3 mr-1" />{t(lang, "common.admin.markRead")}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedMessage.name?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedMessage.name}</p>
                    <a href={`mailto:${selectedMessage.email}`} className="text-sm text-primary hover:underline">{selectedMessage.email}</a>
                  </div>
                  <span className="ml-auto text-xs text-muted-foreground">{formatDate(selectedMessage.created_at)}</span>
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</p>
                <div className="pt-3 border-t">
                  <a href={`mailto:${selectedMessage.email}`}>
                    <Button className="w-full" variant="outline">
                      <Mail className="w-4 h-4 mr-2" />
                      {t(lang, "common.admin.replyByEmail", { email: selectedMessage.email })}
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground mb-3">{t(lang, "common.admin.messageCount", { count: messages.length })}</p>
              {messages.map((msg: any) => (
                <Card
                  key={msg.id}
                  className={`cursor-pointer hover:shadow-md transition-shadow ${!msg.is_read ? "border-primary/30 bg-primary/5" : ""}`}
                  onClick={() => setSelectedMessage(msg)}
                >
                  <CardContent className="pt-3 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
                        {msg.name?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{msg.name}</span>
                          <span className="text-xs text-muted-foreground">{msg.email}</span>
                          {!msg.is_read && <Badge className="text-[10px] px-1.5 py-0">{t(lang, "common.admin.new")}</Badge>}
                          <span className="ml-auto text-xs text-muted-foreground flex-shrink-0">{formatDate(msg.created_at)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{msg.message}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
