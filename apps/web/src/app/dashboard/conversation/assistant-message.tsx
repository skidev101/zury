"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

export function AssistantMessage({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="my-3 space-y-1.5 pl-5 marker:text-accent">{children}</ul>,
        ol: ({ children }) => <ol className="my-3 list-decimal space-y-2 pl-5 marker:text-text-tertiary">{children}</ol>,
        li: ({ children }) => <li className="pl-1">{children}</li>,
        strong: ({ children }) => <strong className="font-semibold text-text-primary">{children}</strong>,
        code: ({ children }) => <code className="rounded-md bg-white/[.06] px-1.5 py-0.5 font-mono text-[.9em] text-text-primary">{children}</code>,
        h1: ({ children }) => <h1 className="mb-3 mt-5 font-heading text-xl font-semibold text-text-primary">{children}</h1>,
        h2: ({ children }) => <h2 className="mb-2 mt-5 font-heading text-lg font-semibold text-text-primary">{children}</h2>,
        h3: ({ children }) => <h3 className="mb-2 mt-4 text-sm font-semibold text-text-primary">{children}</h3>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
}
