import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, ThumbsUp, ChevronDown, ChevronUp, Sparkles, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AICommentProps {
  contextText: string;
  type?: "question" | "answer" | "reply";
}

export function AIComment({ contextText, type = "answer" }: AICommentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [content, setContent] = useState<string | null>(null);

  const handleToggle = () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    setIsOpen(true);
    
    if (!content) {
      setIsLoading(true);
      // Simulate AI delay
      setTimeout(() => {
        setIsLoading(false);
        setContent(generateMockResponse(type));
      }, 1500);
    }
  };

  const generateMockResponse = (type: string) => {
    switch (type) {
      case "question":
        return "AI Analysis: This question touches on a common confusion point in React's lifecycle. A more precise way to ask this would be focusing on referential equality checks in dependency arrays.";
      case "answer":
        return "AI Insight: This answer is technically correct but could be improved by mentioning the `useRef` hook as an alternative for mutable values that shouldn't trigger re-renders.";
      case "reply":
        return "AI Summary: This reply clarifies the previous point but misses the edge case where the object is created outside the component scope.";
      default:
        return "AI Analysis: Here is a helpful breakdown of the content provided.";
    }
  };

  return (
    <div className="mt-3">
      <Button 
        variant="ghost" 
        size="sm" 
        onClick={handleToggle}
        className={cn(
          "text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 text-xs font-medium h-8 px-2 gap-1.5 transition-all duration-300",
          isOpen && "bg-blue-50 dark:bg-blue-900/20"
        )}
      >
        <Sparkles className="w-3.5 h-3.5" />
        AI Sharhi
        {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </Button>

      {isOpen && (
        <div className="mt-3 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900 rounded-lg p-4 shadow-sm relative">
            
            {/* AI Badge */}
            <div className="absolute top-3 right-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                <Wand2 className="w-3 h-3 mr-1" />
                AI
              </span>
            </div>

            {isLoading ? (
              <div className="flex items-center space-x-2 py-2">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <span className="text-xs text-blue-500 ml-2 font-medium">Analyzing content...</span>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                  {content}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
