import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AtSign, Bell, Monitor, Smartphone, Tablet, Laptop, Clock, MapPin, MessageSquare, ThumbsUp, CornerDownLeft, UserPlus, HelpCircle, Loader2 } from "lucide-react";
import { useLocation, Link } from "wouter";
import { useLang } from "@/components/LanguageContext";
import { formatRelativeTime, t } from "@/i18n";

function DeviceIcon({ device }: { device: string }) {
  const d = (device || '').toLowerCase();
  if (d.includes('iphone')) return <Smartphone className="w-5 h-5 text-primary" />;
  if (d.includes('ipad')) return <Tablet className="w-5 h-5 text-primary" />;
  if (d.includes('android telefon')) return <Smartphone className="w-5 h-5 text-primary" />;
  if (d.includes('android planshet')) return <Tablet className="w-5 h-5 text-primary" />;
  if (d.includes('mac') || d.includes('windows') || d.includes('linux')) return <Laptop className="w-5 h-5 text-primary" />;
  return <Monitor className="w-5 h-5 text-primary" />;
}

export function Notifications() {
  const [, navigate] = useLocation();
  const { lang } = useLang();
  const qc = useQueryClient();
  const [terminating, setTerminating] = useState(false);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<any[]>({
    queryKey: ["/api/sessions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/sessions/");
      return res.json();
    },
    enabled: !!getAccessToken(),
  });

  const { data: notifications = [], isLoading: notifsLoading } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications/");
      return res.json();
    },
    enabled: !!getAccessToken(),
  });

  const markRead = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/notifications/${id}/`, { is_read: true });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const terminateSession = async (sessionId: number) => {
    await apiRequest("DELETE", `/api/sessions/${sessionId}/delete/`);
    qc.invalidateQueries({ queryKey: ["/api/sessions"] });
  };

  const terminateAll = async () => {
    setTerminating(true);
    await apiRequest("POST", "/api/sessions/logout-all/");
    qc.invalidateQueries({ queryKey: ["/api/sessions"] });
    setTerminating(false);
  };

  if (!getAccessToken()) {
    navigate("/login");
    return null;
  }

  const formatDate = (dateStr: string) => formatRelativeTime(lang, dateStr);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'answer': return { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
      case 'like': return { icon: ThumbsUp, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' };
      case 'reply': return { icon: CornerDownLeft, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30' };
      case 'follow': return { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'new_question': return { icon: HelpCircle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
      case 'mention': return { icon: AtSign, color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30' };
      default: return { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
    }
  };

  const getNotifText = (notif: any) => {
    const username = notif.sender?.username || "";
    switch (notif.notification_type) {
      case 'answer': return t(lang, "notifications.types.answer", { username });
      case 'like': return t(lang, "notifications.types.like", { username });
      case 'reply': return t(lang, "notifications.types.reply", { username });
      case 'follow': return t(lang, "notifications.types.follow", { username });
      case 'new_question': return t(lang, "notifications.types.newQuestion", { username });
      case 'mention': return t(lang, "notifications.types.mention", { username });
      default: return t(lang, "notifications.new");
    }
  };

  const getNotifLink = (notif: any) => {
    if (notif.question) return `/question/${notif.question}`;
    return '/notifications';
  };

  const handleNotifClick = (notif: any) => {
    if (!notif.is_read) markRead.mutate(notif.id);
    navigate(getNotifLink(notif));
  };

  const unreadCount = notifications.filter((n: any) => !n.is_read).length;

  return (
    <div className="max-w-3xl mx-auto py-8 space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold">{t(lang, "notificationsTitle")}</h1>

      <Tabs defaultValue="notifications">
        <TabsList className="w-full">
          <TabsTrigger value="notifications" className="flex-1">
            <Bell className="w-4 h-4 mr-2" />
            {t(lang, "notificationsTitle")}
            {unreadCount > 0 && (
              <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {unreadCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="sessions" className="flex-1">
            <Monitor className="w-4 h-4 mr-2" />
            {t(lang, "loginDevices")}
          </TabsTrigger>
        </TabsList>

        {/* Notifications */}
        <TabsContent value="notifications" className="space-y-3 mt-4">
          {notifsLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t(lang, "loading")}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t(lang, "noNotifications")}</p>
            </div>
          ) : (
            notifications.map((notif: any) => (
              <Card
                key={notif.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${!notif.is_read ? "border-blue-200 bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                onClick={() => handleNotifClick(notif)}
              >
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start gap-3">
                    {(() => {
                      const { icon: Icon, color, bg } = getNotifIcon(notif.notification_type);
                      return (
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                          <Icon className={`w-4 h-4 ${color}`} />
                        </div>
                      );
                    })()}
                    <div className="flex-1">
                      <p className={`text-sm text-foreground ${!notif.is_read ? 'font-medium' : ''}`}>
                        {getNotifText(notif)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(notif.created_at)}</p>
                    </div>
                    {!notif.is_read && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Sessions */}
        <TabsContent value="sessions" className="space-y-3 mt-4">
          {sessionsLoading ? (
            <div className="text-center py-12 text-muted-foreground">{t(lang, "loading")}</div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Monitor className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>{t(lang, "noNotifications")}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t(lang, "lastDevice")}</p>
                {sessions.filter((s: any) => !s.is_current).length > 0 && (
                  <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={terminateAll} disabled={terminating}>
                    {terminating && <Loader2 className="w-3 h-3 animate-spin mr-1" />}
                    {t(lang, "notifications.sessions.terminateAll")}
                  </Button>
                )}
              </div>
              {sessions.map((session: any) => (
                <Card key={session.id} className={session.is_current ? "border-primary/50 bg-primary/5" : ""}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <DeviceIcon device={session.device_name} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-foreground">{session.device_name}</span>
                          <span className="text-xs text-muted-foreground">{session.browser}</span>
                          {session.is_current && (
                            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                              {t(lang, "currentDevice")}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          {session.ip_address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{session.ip_address}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{formatDate(session.last_activity)}
                          </span>
                        </div>
                      </div>
                      {!session.is_current && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
                          onClick={() => terminateSession(session.id)}
                        >
                          {t(lang, "notifications.sessions.terminate")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
