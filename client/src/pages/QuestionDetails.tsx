import { useParams } from "wouter";
import { MOCK_QUESTIONS, MOCK_ANSWERS } from "@/lib/mockData";
import { QuestionCard } from "@/components/QuestionCard";
import { AIComment } from "@/components/AIComment";
import { LikeButton } from "@/components/LikeButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, CheckCircle2 } from "lucide-react";
import { useState } from "react";

export function QuestionDetails() {
  const { id } = useParams();
  const question = MOCK_QUESTIONS.find(q => q.id === Number(id));
  const answers = MOCK_ANSWERS.filter(a => a.questionId === Number(id));
  const [newAnswer, setNewAnswer] = useState("");

  if (!question) {
    return <div className="text-center py-20">Question not found</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <QuestionCard {...question} />

      <div className="space-y-6">
        <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
          {answers.length} Answers
        </h3>
        
        <div className="space-y-6">
          {answers.map((answer) => (
            <div key={answer.id} className="bg-card border border-border/60 rounded-xl p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="w-10 h-10 border">
                    <AvatarImage src={answer.authorAvatar} />
                    <AvatarFallback>{answer.author[0]}</AvatarFallback>
                  </Avatar>
                  {answer.isAccepted && (
                    <div className="text-green-500" title="Accepted Answer">
                      <CheckCircle2 className="w-6 h-6 fill-green-50" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-foreground">{answer.author}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {answer.createdAt}
                      </div>
                    </div>
                  </div>
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none text-muted-foreground">
                    <p>{answer.content}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-4">
                    <div className="flex items-center gap-4">
                      <LikeButton initialLikes={answer.likes} entityId={answer.id.toString()} type="answer" />
                      <Button variant="link" size="sm" className="h-auto p-0 text-muted-foreground">Reply</Button>
                    </div>
                  </div>

                  {/* AI Comment for Answer */}
                  <AIComment contextText={answer.content} type="answer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Answer Form */}
      <div className="bg-card border border-border/60 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">Your Answer</h3>
        <Textarea 
          placeholder="Write your answer here..." 
          className="min-h-[150px] mb-4 resize-none"
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
        />
        <div className="flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            Markdown is supported. Be polite and helpful.
          </p>
          <Button disabled={!newAnswer.trim()}>Post Answer</Button>
        </div>
      </div>
    </div>
  );
}
