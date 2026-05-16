import { PostComposer } from "@/components/PostComposer";

interface AskQuestionProps {
  onSuccess?: () => void;
  params?: Record<string, string | undefined>;
}

export function AskQuestion({ onSuccess }: AskQuestionProps) {
  return (
    <div className="py-8">
      <PostComposer onSuccess={onSuccess} />
    </div>
  );
}
