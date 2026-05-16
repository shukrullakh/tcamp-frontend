import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, Sparkles, Loader2 } from "lucide-react";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import { cn } from "@/lib/utils";
import { useLang } from "@/components/LanguageContext";
import { t } from "@/i18n";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

export function AIChat() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: t(lang, "post.ai.welcome"),
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const history = messages.map(msg => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content
      }));

      const res = await fetch("/api/ai/chat/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          messages: [
            ...history,
            { role: "user", content: userMessage.content }
          ]
        })
      });

      const data = await res.json();
      const text = data.choices?.[0]?.message?.content || t(lang, "post.ai.answerError");

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: text,
        timestamp: new Date()
      }]);
    } catch (err: any) {
      console.error("Groq error:", err, JSON.stringify(err));
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: t(lang, "post.ai.networkError"),
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[600px] w-full max-w-3xl mx-auto border rounded-xl overflow-hidden bg-background shadow-sm">
      <div className="bg-primary/5 p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{t(lang, "post.ai.assistantShortTitle")}</h3>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Online - Llama 3.3 70B
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-muted-foreground">
          <Sparkles className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/10" ref={scrollRef}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <Avatar className="h-8 w-8 border flex-shrink-0">
              <AvatarFallback className={msg.role === "ai"
                ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 text-xs"
                : "bg-primary text-primary-foreground text-xs"
              }>
                {msg.role === "ai" ? "AI" : "ME"}
              </AvatarFallback>
            </Avatar>

            <div className={cn(
              "p-3 rounded-2xl text-sm shadow-sm",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-tr-none"
                : "bg-card border rounded-tl-none text-card-foreground"
            )}>
              {msg.role === "ai" ? (
                <MarkdownRenderer content={msg.content} className="text-sm" />
              ) : (
                <p className="whitespace-pre-wrap leading-relaxed text-sm">{msg.content}</p>
              )}
              <span className={cn(
                "text-[10px] block mt-1 opacity-70",
                msg.role === "user" ? "text-primary-foreground" : "text-muted-foreground"
              )}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 mr-auto max-w-[85%]">
            <Avatar className="h-8 w-8 border">
              <AvatarFallback className="bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 text-xs">AI</AvatarFallback>
            </Avatar>
            <div className="bg-card border p-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
              <span className="text-xs text-muted-foreground">{t(lang, "post.ai.thinking")}</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-background border-t">
        <div className="relative">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t(lang, "post.ai.placeholder")}
            className="min-h-[50px] pr-12 resize-none rounded-xl focus-visible:ring-offset-0 focus-visible:ring-1"
          />
          <Button
            size="icon"
            className="absolute right-2 bottom-2 h-8 w-8 rounded-lg transition-transform active:scale-95"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-[10px] text-center text-muted-foreground mt-2">
          {t(lang, "post.ai.disclaimer")}
        </p>
      </div>
    </div>
  );
}
