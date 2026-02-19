import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNotifications } from "./NotificationContext";

interface LikeButtonProps {
  initialLikes?: number;
  entityId: string;
  type?: "question" | "answer" | "reply";
}

export function LikeButton({ initialLikes = 0, entityId, type = "question" }: LikeButtonProps) {
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const { addNotification } = useNotifications();

  const handleLike = () => {
    if (isLiked) {
      setLikes(prev => prev - 1);
      setIsLiked(false);
    } else {
      setLikes(prev => prev + 1);
      setIsLiked(true);
      
      // Simulate notification creation
      // In a real app, this would happen on the backend when someone else likes your content
      // For demo, we trigger it here
      if (Math.random() > 0.5) {
        addNotification(
          "like", 
          `Someone liked your ${type}!`,
          `/question/${entityId}`
        );
      }
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleLike}
      className={cn(
        "group flex items-center gap-1.5 h-8 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors",
        isLiked && "text-blue-600 dark:text-blue-500 bg-blue-50 dark:bg-blue-950/30"
      )}
    >
      <ThumbsUp 
        className={cn(
          "w-4 h-4 transition-transform duration-300 group-active:scale-125",
          isLiked && "fill-current"
        )} 
      />
      <span className="text-xs font-medium tabular-nums">{likes}</span>
    </Button>
  );
}
