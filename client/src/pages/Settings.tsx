import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { QuestionCard } from "@/components/QuestionCard";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Lock, Bell, Languages, Loader2, Eye, EyeOff, User, ChevronRight, Bookmark, Smartphone, LogOut } from "lucide-react";
import { useLang } from "@/components/LanguageContext";
import { t, Language } from "@/i18n";
import { useLocation } from "wouter";
import { ProfileUser } from "@/components/profile/ProfileSocial";
import { profile } from "console";


export function Settings() {
  const { toast } = useToast();
  const { lang, setLang } = useLang();
  const [, navigate] = useLocation();
  const [passwords, setPasswords] = useState({ current: '', newPass: '', confirm: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);
  const [emailNotif, setEmailNotif] = useState(true);
  const [showSaved, setShowSaved] = useState(false);

  const { data: savedQuestions = [] } = useQuery<any[]>({
    queryKey: ["/api/saved"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/saved/");
      return res.json();
    },
    enabled: !!getAccessToken() && showSaved,
  });
  const [publicProfile, setPublicProfile] = useState(true);
  const [devices, setDevices] = useState([
    { id: 1, name: 'MacBook Pro', type: 'Safari', lastActive: t(lang, "common.time.now") },
    { id: 2, name: 'iPhone 15', type: 'Safari', lastActive: t(lang, "common.time.hoursAgo", { count: 2 }) },
  ]);

  const handleChangePassword = async () => {
    if (passwords.newPass !== passwords.confirm) {
      toast({ title: t(lang, 'passwordMismatch'), variant: 'destructive' });
      return;
    }
    if (passwords.newPass.length < 8) {
      toast({ title: t(lang, 'passwordTooShort'), variant: 'destructive' });
      return;
    }

    if (!getAccessToken()) { navigate('/login'); return; }

    setSavingPassword(true);
    try {
      await apiRequest('POST', '/api/change-password/', {
        current_password: passwords.current,
        new_password: passwords.newPass,
      });
      toast({ title: t(lang, 'passwordChanged') });
      setPasswords({ current: '', newPass: '', confirm: '' });
      setShowChangePassword(false);
    } catch (err: any) {
      toast({ title: t(lang, 'wrongPassword'), variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleChangeUsername = async () => {
    if (!newUsername.trim()) {
      toast({ title: t(lang, 'usernameRequired'), variant: 'destructive' });
      return;
    }

    if (!getAccessToken()) { navigate('/login'); return; }

    setSavingUsername(true);
    try {
      await apiRequest('POST', '/api/change-username/', {
        new_username: newUsername.trim(),
      });
      toast({ title: t(lang, 'usernameChanged') });
      setNewUsername('');
      setShowChangeUsername(false);
    } catch (err: any) {
      toast({ title: err.message || t(lang, 'usernameChangeError'), variant: 'destructive' });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleLangChange = (value: string) => {
    setLang(value as Language);
    toast({ title: t(value as Language, 'settingsSaved') });
  };

  return (
    <div className="max-w-2xl mx-auto py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-heading font-bold">{t(lang, 'settingsTitle')}</h1>
        <p className="text-muted-foreground">{t(lang, 'settingsDesc')}</p>
      </div>

      {/* Sozlamalar ro'yxati */}
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="divide-y divide-border/40">
          {/* Til */}
          <div className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-3">
              <Languages className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">{t(lang, 'languageRegion')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t(lang, 'languageRegionDesc')}</p>
              </div>
            </div>
            <Select value={lang} onValueChange={handleLangChange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="uz">O'zbekcha</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ru">Русский</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Foydalanuvchi nomi */}
          <div className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">{t(lang, 'changeUsername')}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(lang, "settings.account.changeUsernameDescription")}</p>
                </div>
              </div>
              <Button
                variant={showChangeUsername ? "default" : "outline"}
                size="sm"
                onClick={() => setShowChangeUsername(!showChangeUsername)}
              >
                {showChangeUsername ? t(lang, "common.actions.close") : t(lang, "common.actions.change")}
              </Button>
            </div>
            {showChangeUsername && (
              <div className="mt-4 pt-4 border-t space-y-3 ml-8">
                <div className="space-y-2">
                  <Label className="text-xs">{t(lang, 'newUsername')}</Label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Username"
                    className="text-sm"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setShowChangeUsername(false); setNewUsername(''); }}
                  >
                    {t(lang, "cancel")}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleChangeUsername}
                    disabled={savingUsername || !newUsername.trim()}
                  >
                    {savingUsername && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {t(lang, 'updateUsername')}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Xavfsizlik bo'limi */}
          <div className="bg-muted/10 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-sm">{t(lang, "security")}</h3>
            </div>

            {/* Parol o'zgartirish */}
            <div className="space-y-2 ml-8">
              <div className="p-3 rounded-lg border border-border/40 hover:bg-muted/30 transition-colors flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">{t(lang, "settings.security.changePassword")}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(lang, "settings.security.passwordDescription")}</p>
                </div>
                <Button
                  variant={showChangePassword ? "default" : "outline"}
                  size="sm"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                >
                  {showChangePassword ? t(lang, "common.actions.close") : t(lang, "common.actions.change")}
                </Button>
              </div>

              {showChangePassword && (
                <div className="p-4 bg-muted/20 rounded-lg space-y-3 mt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">{t(lang, "currentPassword")}</Label>
                    <div className="relative">
                      <Input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwords.current}
                        onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                        className="pr-10 text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t(lang, "newPassword")}</Label>
                    <div className="relative">
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwords.newPass}
                        onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
                        className="pr-10 text-sm"
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">{t(lang, "confirmPassword")}</Label>
                    <Input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      className={`text-sm ${passwords.confirm && passwords.confirm !== passwords.newPass ? 'border-red-500' : ''}`}
                    />
                    {passwords.confirm && passwords.confirm !== passwords.newPass && (
                      <p className="text-xs text-red-500">{t(lang, "passwordMismatch")}</p>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowChangePassword(false); setPasswords({ current: '', newPass: '', confirm: '' }); }}
                    >
                      {t(lang, "cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleChangePassword}
                      disabled={savingPassword || !passwords.current || !passwords.newPass || !passwords.confirm}
                    >
                      {savingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {t(lang, "save")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bildirishnomalar */}
          <div className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">{t(lang, "settings.notifications.title")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(lang, "settings.notifications.delivery")}</p>
                </div>
              </div>
            </div>
            <div className="ml-8 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/40 hover:bg-muted/20 transition-colors">
                <div>
                  <p className="text-sm font-medium">{t(lang, "emailNotifications")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(lang, "emailNotificationsDesc")}</p>
                </div>
                <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
              </div>
            </div>
          </div>

          {/* Xavfsizlik va Maxfiylik */}
          <div className="p-4 hover:bg-muted/30 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-primary" />
                <div>
                  <h3 className="font-semibold text-sm">{t(lang, "settings.privacy.profilePrivacy")}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(lang, "publicProfileDesc")}</p>
                </div>
              </div>
              <Switch checked={publicProfile} onCheckedChange={setPublicProfile} />
            </div>
          </div>

          {/* Saqlangan xabarlar */}
          <div
            className="p-4 hover:bg-muted/30 transition-colors flex items-center justify-between cursor-pointer group"
            onClick={() => setShowSaved(!showSaved)}
          >
            <div className="flex items-center gap-3">
              <Bookmark className="w-5 h-5 text-primary" />
              <div>
                <h3 className="font-semibold text-sm">{t(lang, "settings.savedPosts.title")}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {showSaved ? t(lang, "settings.savedPosts.close") : t(lang, "settings.savedPosts.open")}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showSaved ? "rotate-90" : "group-hover:translate-x-1"}`} />
          </div>
          {showSaved && (
            <div className="border-t px-4 py-3 space-y-3 bg-muted/10">
              {savedQuestions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">{t(lang, "settings.savedPosts.empty")}</p>
              ) : (
                savedQuestions.map((q: any) => (
                  <QuestionCard key={q.id} {...q} compact initialSaved={true} />
                ))
              )}
            </div>
          )}
        </div>
      </Card>

      
    </div>
  );
}
