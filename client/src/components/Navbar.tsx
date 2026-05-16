import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "./ThemeContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest, getAccessToken } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bell, Moon, Sun, User, LogOut, Menu, X,
  PlusCircle, MessageSquare, Settings as SettingsIcon, Monitor,
  ThumbsUp, CornerDownLeft, UserPlus, HelpCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/LanguageContext";
import { formatRelativeTime, t } from "@/i18n";
import { AskQuestion } from "@/pages/AskQuestion";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export function Navbar() {
  const [location, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();
  const { lang } = useLang();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [askDialogOpen, setAskDialogOpen] = useState(false);
  const qc = useQueryClient();

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/profile"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/profile/");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const { data: apiNotifs = [] } = useQuery<any[]>({
    queryKey: ["/api/notifications"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/notifications/");
      return res.json();
    },
    enabled: isAuthenticated,
    refetchInterval: 30000,
  });

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/login-sessions"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/login-sessions/");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const unreadCount = apiNotifs.filter((n: any) => !n.is_read).length;
  const latestSession = sessions[0];

  const avatarUrl = profile?.avatar ? 
    (profile.avatar.includes('http://localhost') || profile.avatar.includes('http://127') ? 
      profile.avatar.replace(/^https?:\/\/[^\/]+/, '') : profile.avatar) : undefined;
  const displayName = profile?.first_name
    ? `${profile.first_name} ${profile.last_name}`.trim()
    : profile?.username || t(lang, "profile.labels.you");
  const displayEmail = profile?.email || "";
  const avatarFallback = (profile?.username?.[0] || "U").toUpperCase();

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

  const markRead = async (notif: any) => {
    if (!notif.is_read) {
      await apiRequest("PATCH", `/api/notifications/${notif.id}/`, { is_read: true });
      qc.invalidateQueries({ queryKey: ["/api/notifications"] });
    }
  };

  const formatTime = (dateStr: string) => formatRelativeTime(lang, dateStr);

  const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <Link href={href}>
      <span className={cn(
        "text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md cursor-pointer",
        location === href ? "text-primary bg-primary/5 dark:bg-primary/10" : "text-muted-foreground"
      )}>
        {children}
      </span>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <Dialog open={askDialogOpen} onOpenChange={setAskDialogOpen}>
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <span className="flex items-center gap-2 group cursor-pointer">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-foreground">
                T<span className="text-primary">Camp</span>
              </span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">{t(lang, "home")}</NavLink>
            <DialogTrigger asChild>
              <button className={cn(
                "text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md cursor-pointer",
                location === "/ask" ? "text-primary bg-primary/5 dark:bg-primary/10" : "text-muted-foreground"
              )}>
                {t(lang, "askQuestion")}
              </button>
            </DialogTrigger>
            <NavLink href="/ask-ai">{t(lang, "askAI")}</NavLink>
            <NavLink href="/settings">{t(lang, 'settings')}</NavLink>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-3">

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative cursor-pointer text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center ring-2 ring-background">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <span className="font-semibold text-sm">{t(lang, 'notifications')}</span>
                <Link href="/notifications">
                  <span className="text-xs text-primary hover:underline cursor-pointer">{t(lang, "notifications.all")}</span>
                </Link>
              </div>

              <div className="max-h-[350px] overflow-y-auto">
                {isAuthenticated && latestSession && (
                  <div className="px-4 py-3 border-b bg-green-50/50 dark:bg-green-900/10">
                    <div className="flex items-start gap-3">
                      <Monitor className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">
                          {t(lang, "notifications.sessions.login", { device: latestSession.device })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {latestSession.ip_address && `IP: ${latestSession.ip_address} • `}
                          {formatTime(latestSession.logged_in_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {apiNotifs.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    {t(lang, "notifications.empty")}
                  </div>
                ) : (
                  apiNotifs.slice(0, 5).map((notif: any) => (
                    <Link href={getNotifLink(notif)} key={notif.id}>
                      <div
                        className={cn(
                          "px-4 py-3 border-b last:border-0 text-sm cursor-pointer hover:bg-muted/50 transition-colors",
                          !notif.is_read && "bg-blue-50/50 dark:bg-blue-900/10"
                        )}
                        onClick={() => markRead(notif)}
                      >
                        <div className="flex items-start gap-2">
                          {(() => {
                            const icons: any = {
                              answer: { icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
                              like: { icon: ThumbsUp, color: 'text-rose-500', bg: 'bg-rose-100 dark:bg-rose-900/30' },
                              reply: { icon: CornerDownLeft, color: 'text-violet-500', bg: 'bg-violet-100 dark:bg-violet-900/30' },
                              follow: { icon: UserPlus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' },
                              new_question: { icon: HelpCircle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' },
                            };
                            const { icon: Icon, color, bg } = icons[notif.notification_type] || { icon: Bell, color: 'text-gray-500', bg: 'bg-gray-100' };
                            return (
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${bg}`}>
                                <Icon className={`w-3.5 h-3.5 ${color}`} />
                              </div>
                            );
                          })()}
                          <div className="flex-1">
                            <p className={cn("text-xs leading-snug", !notif.is_read && "font-medium")}>
                              {getNotifText(notif)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {formatTime(notif.created_at)}
                            </p>
                          </div>
                          {!notif.is_read && (
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <div className="p-2 border-t bg-muted/30 text-center">
                <Link href="/notifications">
                  <span className="text-xs text-primary hover:underline font-medium cursor-pointer">
                    {t(lang, "notifications.viewAll")}
                  </span>
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <LanguageSwitcher compact />

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground cursor-pointer hover:text-foreground hidden sm:flex"
            aria-label={t(lang, "common.theme.toggle")}
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          {/* Auth */}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 cursor-pointer rounded-full overflow-hidden border border-border/50 p-0">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover rounded-full" />
                  ) : (
                    <span className="text-sm font-bold">{avatarFallback}</span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{displayName}</p>
                    <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <span className="flex items-center cursor-pointer w-full">
                      <User className="mr-2 h-4 w-4" />{t(lang, 'profile')}
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">
                    <span className="flex items-center cursor-pointer w-full">
                      <SettingsIcon className="mr-2 h-4 w-4" />{t(lang, 'settings')}
                    </span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <DialogTrigger asChild>
                    <button className="flex items-center cursor-pointer w-full text-left">
                      <PlusCircle className="mr-2 h-4 w-4" />{t(lang, 'askQuestion')}
                    </button>
                  </DialogTrigger>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:text-red-600 cursor-pointer" onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" />{t(lang, 'logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <span className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-primary cursor-pointer">{t(lang, 'login')}</span>
              </Link>
              <Link href="/register">
                <span className="text-sm font-medium bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 cursor-pointer whitespace-nowrap">{t(lang, 'register')}</span>
              </Link>
            </div>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} aria-label={isMobileMenuOpen ? t(lang, "common.a11y.closeMenu") : t(lang, "common.a11y.menu")}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background animate-in slide-in-from-top-5">
          <nav className="flex flex-col space-y-3">
            <Link href="/"><span className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>{t(lang, "home")}</span></Link>
            <button type="button" onClick={() => { setAskDialogOpen(true); setIsMobileMenuOpen(false); }} className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md cursor-pointer text-left w-full">
              {t(lang, "askQuestion")}
            </button>
            <Link href="/ask-ai"><span className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>{t(lang, 'askAI')}</span></Link>
            <Link href="/settings"><span className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>{t(lang, 'settings')}</span></Link>
            <Link href="/profile"><span className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>{t(lang, 'profile')}</span></Link>
            <Link href="/notifications"><span className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>{t(lang, 'notifications')}</span></Link>
            <button
              onClick={() => { setTheme(theme === 'dark' ? 'light' : 'dark'); setIsMobileMenuOpen(false); }}
              className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md w-full text-left"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              {theme === 'dark' ? t(lang, "common.theme.light") : t(lang, "common.theme.dark")}
            </button>
            {isAuthenticated && (
              <button onClick={logout} className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md text-red-600 w-full text-left">
                <LogOut className="h-4 w-4" />{t(lang, 'logout')}
              </button>
            )}
          </nav>
        </div>
      )}
        <DialogContent className="top-20 left-1/2 -translate-x-1/2 translate-y-0 max-w-4xl w-full max-h-[calc(100vh-6rem)] rounded-[2rem] p-0 overflow-hidden shadow-2xl">
          <AskQuestion onSuccess={() => setAskDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </header>
  );
}
