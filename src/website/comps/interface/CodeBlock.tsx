import clsx from "clsx";
import { useState, useEffect } from "react";
import { codeToHtml } from "shiki";
import { Icon } from "../../images/Icon";

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
        {copied ? <Icon.Check className="size-4 text-[#4ade80]" /> : <Icon.Copy className="size-4" />}
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
