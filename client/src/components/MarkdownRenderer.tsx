import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface Props {
  content: string;
  className?: string;
}

function remarkPreserveNewlines() {
  return (tree: any) => {
    const visit = (node: any) => {
      if (!node || !Array.isArray(node.children)) return;

      node.children = node.children.flatMap((child: any) => {
        if (child.type !== 'text' || typeof child.value !== 'string' || !child.value.includes('\n')) {
          visit(child);
          return [child];
        }

        return child.value.split('\n').flatMap((part: string, index: number) => {
          const nodes = [];
          if (index > 0) nodes.push({ type: 'break' });
          if (part) nodes.push({ ...child, value: part });
          return nodes;
        });
      });

      node.children.forEach(visit);
    };

    visit(tree);
  };
}

export function MarkdownRenderer({ content, className }: Props) {
  return (
    <div className={cn("markdown-body prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap break-words [overflow-wrap:anywhere]", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkPreserveNewlines]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={{
          code({ node, className, children, ...props }: any) {
            const isInline = !className;
            const match = /language-(\w+)/.exec(className || '');
            if (!isInline && match) {
              return (
                <div className="relative group my-3">
                  <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded opacity-70">
                    {match[1]}
                  </div>
                  <pre className="overflow-x-auto rounded-lg bg-muted/80 dark:bg-zinc-900 p-4 pt-8 text-sm border">
                    <code className={className} {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            }
            return (
              <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-primary" {...props}>
                {children}
              </code>
            );
          },
          pre({ children }: any) {
            return <>{children}</>;
          },
          blockquote({ children }: any) {
            return (
              <blockquote className="border-l-4 border-primary/40 pl-4 italic text-muted-foreground my-3">
                {children}
              </blockquote>
            );
          },
          h1: ({ children }: any) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
          h2: ({ children }: any) => <h2 className="text-lg font-bold mt-3 mb-2">{children}</h2>,
          h3: ({ children }: any) => <h3 className="text-base font-semibold mt-3 mb-1">{children}</h3>,
          ul: ({ children }: any) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
          ol: ({ children }: any) => <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>,
          li: ({ children }: any) => <li className="text-sm">{children}</li>,
          p: ({ children }: any) => <p className="my-1.5 whitespace-pre-wrap break-words [overflow-wrap:anywhere] leading-relaxed">{children}</p>,
          a: ({ href, children }: any) => (
            <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              {children}
            </a>
          ),
          table: ({ children }: any) => (
            <div className="overflow-x-auto my-3">
              <table className="min-w-full border border-border rounded-lg text-sm">{children}</table>
            </div>
          ),
          th: ({ children }: any) => <th className="border border-border px-3 py-2 bg-muted font-semibold text-left">{children}</th>,
          td: ({ children }: any) => <td className="border border-border px-3 py-2">{children}</td>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
