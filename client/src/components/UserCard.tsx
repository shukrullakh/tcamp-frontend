import { Link } from "wouter";
import { BadgeCheck } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { getAccessToken } from "@/lib/queryClient";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";
import { getMediaUrl } from "@/lib/media";

interface UserCardProps {
  author: {
    id: number;
    username: string;
    first_name?: string;
    last_name?: string;
    avatar?: string;
    bio?: string;
    is_verified?: boolean;
    followers_count?: number;
    following_count?: number;
  } | string;
  date?: string;
  size?: 'sm' | 'md';
}

function getCurrentUserId(): number | null {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.user_id;
  } catch {
    return null;
  }
}

export function UserCard({ author, date, size = 'sm' }: UserCardProps) {
  const { lang } = useLang();
  if (typeof author === 'string') {
    return <span className="text-sm text-muted-foreground">{author}</span>;
  }

  const currentUserId = getCurrentUserId();
  const isOwn = currentUserId !== null && author.id === currentUserId;
  const href = isOwn ? '/profile' : `/user/${author.username}`;

  const fullName = [author.first_name, author.last_name].filter(Boolean).join(' ');
  const avatarSize = size === 'md' ? 'w-10 h-10' : 'w-6 h-6';
  const fallback = (author.first_name?.[0] || author.username?.[0] || 'U').toUpperCase();

  return (
    <HoverCard openDelay={250} closeDelay={80}>
      <HoverCardTrigger asChild>
        <Link href={href}>
          <span className="flex cursor-pointer items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group">
            <Avatar className={`${avatarSize} flex-shrink-0 border border-border bg-muted`}>
              <AvatarImage src={getMediaUrl(author.avatar || '')} alt={author.username} />
              <AvatarFallback className="text-xs font-semibold">{fallback}</AvatarFallback>
            </Avatar>
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="flex min-w-0 items-center gap-1">
                <span className={`truncate font-semibold text-foreground transition-colors group-hover:text-primary ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
                  {fullName || author.username}
                </span>
                {author.is_verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 fill-primary text-primary-foreground" />}
              </span>
              <span className={`truncate text-muted-foreground ${size === 'md' ? 'text-xs' : 'text-[11px]'}`}>
                @{author.username}
              </span>
            </span>
          </span>
        </Link>
      </HoverCardTrigger>
      <HoverCardContent className="w-72 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-14 w-14 border border-border bg-muted">
            <AvatarImage src={getMediaUrl(author.avatar || '')} alt={author.username} />
            <AvatarFallback className="text-lg font-bold">{fallback}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate font-bold">{fullName || author.username}</p>
              {author.is_verified && <BadgeCheck className="h-4 w-4 fill-primary text-primary-foreground" />}
            </div>
            <p className="text-sm text-muted-foreground">@{author.username}</p>
          </div>
        </div>
        {author.bio && <p className="mt-3 line-clamp-3 text-sm leading-5 text-muted-foreground">{author.bio}</p>}
        <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
          <span>{t(lang, "profile.stats.following", { count: author.following_count || 0 })}</span>
          <span>{t(lang, "profile.stats.followers", { count: author.followers_count || 0 })}</span>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
