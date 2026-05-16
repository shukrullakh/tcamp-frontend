import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, getAccessToken, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface LikeButtonProps {
  likesCount?: number;
  upvotes?: number;
  downvotes?: number;
  entityId: string;
  type?: "question" | "answer" | "reply";
}

export function LikeButton({ likesCount, upvotes = 0, entityId, type = "question" }: LikeButtonProps) {
  const [count, setCount] = useState(upvotes || likesCount || 0);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  // Check localStorage for liked status on mount
  useEffect(() => {
    const likedKey = `liked_${type}_${entityId}`;
    const storedLiked = localStorage.getItem(likedKey) === 'true';
    setLiked(storedLiked);
  }, [entityId, type]);

  const handleVote = async () => {
    if (!getAccessToken()) {
      navigate("/login");
      return;
    }

    setLoading(true);
    try {
      const res = await apiRequest("POST", "/api/like/", {
        type,
        id: Number(entityId),
        vote_type: "upvote",
      });
      const data = await res.json();
      
      const newLiked = data.voted === "upvote" || !liked;
      setCount(data.upvotes ?? (newLiked ? count + 1 : Math.max(0, count - 1)));
      setLiked(newLiked);
      
      // Save to localStorage for persistence
      const likedKey = `liked_${type}_${entityId}`;
      localStorage.setItem(likedKey, String(newLiked));
      
      // Refetch relevant queries to update UI
      queryClient.invalidateQueries({ queryKey: [`/api/${type}s`] });
    } catch (err) {
      console.error("Like error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleVote}
      disabled={loading}
      className={cn(
        "flex items-center gap-1.5 h-8 px-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors",
        liked && "text-red-500 bg-red-50 dark:bg-red-950/30"
      )}
    >
      <Heart className={cn("w-4 h-4 transition-transform duration-300 active:scale-125", liked && "fill-red-500 text-red-500")} />
      <span className="text-xs font-medium tabular-nums">{count}</span>
    </Button>
  );
}
