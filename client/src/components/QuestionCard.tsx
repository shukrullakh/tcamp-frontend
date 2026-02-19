import { Link } from "wouter";
import { MessageSquare, Calendar, Tag, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { LikeButton } from "./LikeButton";
import { AIComment } from "./AIComment";

interface QuestionCardProps {
  id: number;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  createdAt: string;
  likes: number;
  tags: string[];
  answers: number;
  compact?: boolean;
}

export function QuestionCard({
  id,
  title,
  content,
  author,
  authorAvatar,
  createdAt,
  likes,
  tags,
  answers,
  compact = false
}: QuestionCardProps) {
  return (
    <Card className="border border-border/60 shadow-sm hover:shadow-md transition-shadow duration-300 bg-card overflow-hidden group">
      <CardHeader className="pb-3 pt-5 px-5 md:px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5">
            <Link href={`/question/${id}`}>
              <a className="font-heading font-semibold text-lg md:text-xl text-foreground hover:text-primary transition-colors line-clamp-2">
                {title}
              </a>
            </Link>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Avatar className="w-5 h-5 border border-border">
                  <AvatarImage src={authorAvatar} alt={author} />
                  <AvatarFallback>{author[0]}</AvatarFallback>
                </Avatar>
                <span className="font-medium text-foreground/80">{author}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {createdAt}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col items-center justify-center min-w-[3.5rem] h-[3.5rem] rounded-lg bg-muted/30 border border-border/50 text-muted-foreground hidden sm:flex">
            <span className="font-bold text-lg text-foreground leading-none">{answers}</span>
            <span className="text-[10px] uppercase font-medium tracking-wide">Ans</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pb-3 px-5 md:px-6">
        <p className={`text-sm md:text-base text-muted-foreground leading-relaxed ${compact ? 'line-clamp-2' : ''}`}>
          {content}
        </p>
        
        {!compact && (
          <div className="mt-4 flex flex-wrap gap-2">
            {tags.map(tag => (
              <Badge key={tag} variant="secondary" className="px-2 py-0.5 text-xs font-normal bg-secondary/50 text-secondary-foreground hover:bg-secondary border border-transparent hover:border-border/50 transition-all">
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="pt-2 pb-4 px-5 md:px-6 flex flex-col border-t border-border/30 bg-muted/10">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-4">
            <LikeButton initialLikes={likes} entityId={id.toString()} />
            
            <Link href={`/question/${id}`}>
              <a className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>{answers} Answers</span>
              </a>
            </Link>
          </div>

          {compact && (
            <Link href={`/question/${id}`}>
              <a className="text-xs font-medium text-primary hover:text-primary/80 flex items-center ml-2">
                View <ArrowRight className="w-3 h-3 ml-1" />
              </a>
            </Link>
          )}
        </div>
        
        <div className="w-full">
           <AIComment contextText={content} type="question" />
        </div>
      </CardFooter>
    </Card>
  );
}
