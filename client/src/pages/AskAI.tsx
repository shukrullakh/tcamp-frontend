import { AIChat } from "@/components/AIChat";

export function AskAI() {
  return (
    <div className="max-w-4xl mx-auto py-4 md:py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-heading font-bold text-foreground">AI Study Assistant</h1>
        <p className="text-muted-foreground">
          Ask questions, get explanations, and clear your doubts instantly.
        </p>
      </div>
      
      <AIChat />
    </div>
  );
}
