import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getMediaUrl } from "@/lib/media";

interface AuthorInfoProps {
  author: { id: number; username: string; first_name?: string; last_name?: string; avatar?: string } | string;
  createdAt?: string;
  size?: "sm" | "md";
}

function normalizeImageUrl(url?: string) {
  if (!url) return undefined;

  try {
    const parsed = new URL(url);

    if (
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "localhost"
    ) {
      parsed.hostname = window.location.hostname;
    }

    return parsed.toString();
  } catch {
    return url;
  }
}

export function AuthorInfo({ author, createdAt, size = "sm" }: AuthorInfoProps) {
  const username = typeof author === "object" ? author.username : author;
  const firstName = typeof author === "object" ? author.first_name : "";
  const lastName = typeof author === "object" ? author.last_name : "";
  const avatarUrl = typeof author === "object"
    ? author.avatar || ""
    : undefined;
  const displayName = firstName ? `${firstName} ${lastName}`.trim() : username;
  const avatarSize = size === "md" ? "w-10 h-10" : "w-6 h-6";

  return (
    <Link href={`/user/${username}`}>
      <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
        <Avatar className={`${avatarSize} border border-border flex-shrink-0`}>
          <AvatarImage src={getMediaUrl(avatarUrl)} alt={displayName} />
          <AvatarFallback className="text-xs font-bold">
            {username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
          {displayName !== username && (
            <p className="text-xs text-muted-foreground leading-tight">@{username}</p>
          )}
          {createdAt && (
            <p className="text-xs text-muted-foreground">
              {new Date(createdAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
