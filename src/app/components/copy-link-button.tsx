"use client";

import { Button } from "./ui/button";

interface CopyLinkButtonProps {
  sessionId: string;
}

export default function CopyLinkButton({ sessionId }: CopyLinkButtonProps) {
  return (
    <Button
      className="hidden sm:flex items-center gap-2 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      onClick={() => {
        navigator.clipboard.writeText(
          `${window.location.origin}/session/${sessionId}`
        );
      }}
    >
      <span>Copiar link</span>
    </Button>
  );
}
