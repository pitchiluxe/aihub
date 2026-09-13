"use client";

import { Suspense, lazy } from "react";

// The markdown stack (react-markdown + remark-gfm and their micromark/mdast
// dependency tree) is ~350 KB. It only matters once an AI message is on screen,
// so it loads on first use. While the chunk arrives the text renders as
// plain pre-wrapped content rather than a spinner: the words are readable
// immediately and simply gain formatting a moment later, which matters for
// streaming answers where the text is already arriving.
const MarkdownRenderer = lazy(() => import("./MarkdownRenderer"));

interface Props {
  content: string;
  /** Optional accent color for theming (e.g., agent color). Defaults to --primary. */
  accent?: string;
}

export default function Markdown({ content, accent }: Props) {
  return (
    <Suspense
      fallback={
        <div className="aihub-md" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {content}
        </div>
      }
    >
      <MarkdownRenderer content={content} accent={accent} />
    </Suspense>
  );
}
