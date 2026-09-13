"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, ExternalLink } from "lucide-react";

// Full GitHub-flavored markdown renderer for AI chat messages — tables,
// fenced code with copy button, headings, lists, blockquotes, task lists.
// Ported from AIHub-Browser and adapted to AIHub's design tokens.

interface Props {
  content: string;
  /** Optional accent color for theming (e.g., agent color). Defaults to --primary. */
  accent?: string;
}

// Language color mapping for code block headers
const LANG_COLORS: Record<string, string> = {
  javascript: "#f7df1e", js: "#f7df1e", typescript: "#3178c6", ts: "#3178c6",
  tsx: "#3178c6", jsx: "#61dafb", python: "#3776ab", py: "#3776ab",
  markdown: "#083fa1", md: "#083fa1", html: "#e34c26", css: "#1572b6",
  json: "#292929", bash: "#4eaa25", sh: "#4eaa25", shell: "#4eaa25",
  powershell: "#012456", ps1: "#012456", sql: "#e38c00", java: "#b07219",
  csharp: "#178600", cs: "#178600", cpp: "#f34b7d", "c++": "#f34b7d",
  c: "#555555", go: "#00add8", rust: "#dea584", ruby: "#701516",
  php: "#4f5d95", yaml: "#cb171e", yml: "#cb171e", xml: "#0060ac",
  csv: "#237346", text: "#666666", txt: "#666666",
};

export default function MarkdownRenderer({ content, accent }: Props) {
  const accentVar = accent || "var(--primary)";

  return (
    <div
      className="aihub-md"
      style={{ ["--md-accent" as string]: accentVar } as React.CSSProperties}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              title={href}
              style={{
                color: "var(--md-accent)",
                textDecoration: "underline",
                textUnderlineOffset: 2,
                fontWeight: 500,
                display: "inline-flex",
                alignItems: "center",
                gap: 3,
                verticalAlign: "baseline",
                wordBreak: "break-word",
              }}
            >
              {children}
              <ExternalLink size={9} style={{ flexShrink: 0, opacity: 0.7 }} />
            </a>
          ),

          table: ({ children }) => (
            <div style={{
              overflowX: "auto",
              margin: "10px 0",
              borderRadius: 10,
              border: "1px solid var(--border)",
            }}>
              <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 11.5, lineHeight: 1.5 }}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{
              background: "linear-gradient(180deg, color-mix(in srgb, var(--md-accent) 16%, transparent), color-mix(in srgb, var(--md-accent) 10%, transparent))",
            }}>{children}</thead>
          ),
          th: ({ children }) => (
            <th style={{
              padding: "8px 11px",
              textAlign: "left",
              fontWeight: 700,
              color: "var(--md-accent)",
              borderBottom: "1.5px solid color-mix(in srgb, var(--md-accent) 28%, transparent)",
              whiteSpace: "nowrap",
              fontSize: 10.5,
              letterSpacing: "0.02em",
            }}>{children}</th>
          ),
          td: ({ children }) => (
            <td style={{
              padding: "7px 11px",
              color: "var(--foreground)",
              borderBottom: "1px solid var(--border)",
              verticalAlign: "top",
            }}>{children}</td>
          ),
          tr: ({ children }) => <tr style={{ transition: "background 0.1s" }}>{children}</tr>,
          tbody: ({ children }) => <tbody>{children}</tbody>,

          code: (props: React.ComponentProps<"code"> & { node?: unknown }) => {
            const { className, children } = props;
            const text = String(children ?? "").replace(/\n$/, "");
            // react-markdown v10 drops `inline`; block code always arrives
            // wrapped in <pre> (handled below), so single-line no-lang code
            // with no newlines is treated as inline.
            const isBlock = /language-/.test(className || "") || text.includes("\n");
            if (!isBlock) {
              return (
                <code style={{
                  background: "color-mix(in srgb, var(--md-accent) 12%, transparent)",
                  color: "var(--md-accent)",
                  borderRadius: 5,
                  padding: "1px 6px",
                  fontSize: "0.9em",
                  fontFamily: "var(--font-mono), ui-monospace, SFMono-Regular, Consolas, monospace",
                  border: "1px solid color-mix(in srgb, var(--md-accent) 10%, transparent)",
                }}>{text}</code>
              );
            }
            const lang = (className || "").replace("language-", "");
            return <CodeBlock text={text} lang={lang} />;
          },
          pre: ({ children }) => <>{children}</>,

          h1: ({ children }) => (
            <div style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--foreground)",
              margin: "12px 0 6px",
              paddingBottom: 4,
              borderBottom: "1px solid var(--border)",
            }}>{children}</div>
          ),
          h2: ({ children }) => (
            <div style={{
              fontSize: 14,
              fontWeight: 800,
              color: "var(--md-accent)",
              margin: "12px 0 5px",
              letterSpacing: "-0.01em",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}>
              <span style={{
                width: 4,
                height: 14,
                borderRadius: 2,
                background: "linear-gradient(180deg, var(--ai-gradient-start), var(--ai-gradient-end))",
                flexShrink: 0,
              }} />
              {children}
            </div>
          ),
          h3: ({ children }) => (
            <div style={{
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--foreground)",
              margin: "10px 0 4px",
            }}>{children}</div>
          ),
          h4: ({ children }) => (
            <div style={{
              fontSize: 12,
              fontWeight: 700,
              color: "var(--muted-foreground)",
              margin: "8px 0 3px",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}>{children}</div>
          ),

          p: ({ children }) => <p style={{ margin: "5px 0", lineHeight: 1.6 }}>{children}</p>,
          ul: ({ children }) => <ul style={{ margin: "5px 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 3 }}>{children}</ul>,
          ol: ({ children }) => <ol style={{ margin: "5px 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 3 }}>{children}</ol>,
          li: ({ children }) => <li style={{ lineHeight: 1.55 }}>{children}</li>,

          blockquote: ({ children }) => (
            <blockquote style={{
              margin: "8px 0",
              padding: "8px 12px",
              borderLeft: "3px solid var(--md-accent)",
              background: "color-mix(in srgb, var(--md-accent) 8%, transparent)",
              borderRadius: "0 10px 10px 0",
              color: "var(--muted-foreground)",
              fontStyle: "italic",
            }}>{children}</blockquote>
          ),

          hr: () => (
            <div style={{
              height: 1,
              margin: "12px 0",
              background: "linear-gradient(90deg, transparent, var(--border), transparent)",
            }} />
          ),

          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: "var(--foreground)" }}>{children}</strong>
          ),
          em: ({ children }) => <em style={{ color: "var(--muted-foreground)" }}>{children}</em>,

          // Task list support (GFM)
          input: ({ checked, ...props }: React.ComponentProps<"input">) => (
            <input
              {...props}
              type="checkbox"
              checked={!!checked}
              readOnly
              style={{
                marginRight: 6,
                accentColor: "var(--md-accent)",
                verticalAlign: "middle",
              }}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({ text, lang }: { text: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }).catch(() => {});
  };

  const langColor = LANG_COLORS[lang.toLowerCase()] || "var(--muted-foreground)";
  const displayLabel = lang || "code";

  return (
    <div style={{
      margin: "10px 0",
      borderRadius: 10,
      overflow: "hidden",
      border: "1px solid var(--border)",
      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
    }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "6px 12px",
        background: "linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.22))",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}>
        <span style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "lowercase",
          color: "rgba(255,255,255,0.6)",
        }}>
          <span style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: langColor,
            boxShadow: `0 0 6px ${langColor}88`,
          }} />
          {displayLabel}
        </span>
        <button onClick={copy} title="Copy code" style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "none",
          border: "none",
          cursor: "pointer",
          color: copied ? "#34d399" : "rgba(255,255,255,0.5)",
          fontSize: 10,
          padding: "3px 6px",
          borderRadius: 6,
          transition: "background 0.12s, color 0.12s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)" }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent" }}>
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre style={{
        margin: 0,
        padding: "10px 12px",
        overflowX: "auto",
        background: "#1e1e2e",
        fontSize: 11.5,
        lineHeight: 1.6,
        fontFamily: "var(--font-mono), ui-monospace, \"Cascadia Code\", SFMono-Regular, Consolas, monospace",
        color: "#cdd6f4",
        userSelect: "text",
      }}>
        <code>{text}</code>
      </pre>
    </div>
  );
}
