import clsx from "clsx";
import { useState, useEffect } from "react";
import { codeToHtml } from "shiki";

type Props = {
  children: string;
  language: string;
  variant?: "compact";
};
export function CodeBlock({ children, language, variant }: Props) {
  const [html, setHtml] = useState("");
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    codeToHtml(children, { lang: language, theme: "synthwave-84" }).then(setHtml);
  }, [children, language]);
  return (
    <div className="relative group">
      <button
        onClick={() => {
          navigator.clipboard.writeText(children);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-md bg-white/10 text-white/50 hover:text-white/90 hover:bg-white/20 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
      >
        {copied ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        )}
      </button>
      <div
        className={clsx(
          "[&_pre]:rounded-xl [&_pre]:leading-relaxed [&_pre]:overflow-x-auto",
          variant === "compact" ? "[&_pre]:p-4 [&_pre]:text-xs" : "[&_pre]:p-5",
        )}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
