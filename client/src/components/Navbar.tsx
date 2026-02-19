import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useTheme } from "./ThemeContext";
import { useNotifications } from "./NotificationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Bell,
  Moon,
  Sun,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  MessageSquare,
  Settings as SettingsIcon
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Mock user for now
  const user = {
    name: "Student User",
    email: "student@university.edu",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"
  };

  const NavLink = ({ href, children, active = false }: { href: string; children: React.ReactNode; active?: boolean }) => (
    <Link href={href}>
      <a className={cn(
        "text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded-md",
        active || location === href 
          ? "text-primary bg-primary/5 dark:bg-primary/10" 
          : "text-muted-foreground"
      )}>
        {children}
      </a>
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <a className="flex items-center gap-2 group">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg group-hover:bg-blue-700 transition-colors">
                <MessageSquare className="w-5 h-5" />
              </div>
              <span className="font-heading font-bold text-xl tracking-tight text-foreground">
                Talaba<span className="text-primary">Campus</span>
              </span>
            </a>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href="/">Home</NavLink>
            <NavLink href="/ask">Ask Question</NavLink>
            <NavLink href="/ask-ai">Ask AI</NavLink>
            <NavLink href="/settings">Settings</NavLink>
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          
          {/* Search Bar - Desktop */}
          <div className="hidden md:flex relative w-64 lg:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder="Search questions..." 
              className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:bg-background transition-all" 
            />
          </div>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border-border/60">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
                <span className="font-semibold text-sm">Notifications</span>
                {unreadCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="h-auto px-2 py-0.5 text-xs text-primary hover:text-primary/80"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem 
                      key={notification.id}
                      className={cn(
                        "px-4 py-3 cursor-pointer border-b last:border-0 items-start gap-3",
                        !notification.isRead && "bg-blue-50/50 dark:bg-blue-900/10"
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className={cn(
                        "mt-1 w-2 h-2 rounded-full flex-shrink-0",
                        !notification.isRead ? "bg-blue-500" : "bg-transparent"
                      )} />
                      <div className="flex-1 space-y-1">
                        <p className={cn("text-sm leading-snug", !notification.isRead && "font-medium text-foreground")}>
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </DropdownMenuItem>
                  ))
                )}
              </div>
              <div className="p-2 border-t bg-muted/30 text-center">
                <Link href="/notifications">
                  <a className="text-xs text-primary hover:underline font-medium">View all notifications</a>
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Toggle */}
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
          >
            <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* User Profile */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full overflow-hidden border border-border/50">
                <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <div className="flex items-center cursor-pointer w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <div className="flex items-center cursor-pointer w-full">
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/ask">
                  <div className="flex items-center cursor-pointer w-full">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    <span>Ask Question</span>
                  </div>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t p-4 bg-background animate-in slide-in-from-top-5">
          <nav className="flex flex-col space-y-3">
            <Link href="/">
              <a className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                Home
              </a>
            </Link>
            <Link href="/ask">
              <a className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                Ask Question
              </a>
            </Link>
            <Link href="/ask-ai">
              <a className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                Ask AI
              </a>
            </Link>
            <Link href="/settings">
              <a className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                Settings
              </a>
            </Link>
            <Link href="/profile">
              <a className="flex items-center gap-2 text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={() => setIsMobileMenuOpen(false)}>
                Profile
              </a>
            </Link>
            <div className="pt-2">
              <Input 
                type="search" 
                placeholder="Search questions..." 
                className="w-full bg-muted/50" 
              />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
