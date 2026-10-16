"use client";

import { useState } from "react";
import { createClient } from "../lib/supabase/client";

type VoteType = "yes" | "no" | "maybe";

interface VoteButtonProps {
  sessionId: string;
  overlapDay: string;
  overlapStart: string;
  overlapEnd: string;
  currentVote: VoteType | null;
  onVoteChange: (voteType: VoteType | null) => void;
}

export default function VoteButton({
  sessionId,
  overlapDay,
  overlapStart,
  overlapEnd,
  currentVote,
  onVoteChange,
}: VoteButtonProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  async function handleVote(voteType: VoteType) {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("votes")
        .upsert({
          session_id: sessionId,
          overlap_day: overlapDay,
          overlap_start_time: overlapStart,
          overlap_end_time: overlapEnd,
          user_id: user.id,
          vote_type: voteType,
        }, {
          onConflict: "session_id, overlap_day, overlap_start_time, overlap_end_time, user_id",
        });

      if (error) {
        console.error("Error guardando voto:", error);
        return;
      }

      onVoteChange(voteType);
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  const isYes = currentVote === "yes";
  const isNo = currentVote === "no";
  const isMaybe = currentVote === "maybe";

  return (
    <div className="flex gap-1">
      <button
        onClick={() => handleVote("yes")}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
          isYes
            ? "bg-green-100 text-green-700 border border-green-200"
            : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
        }`}
        title="Sí, me funciona"
      >
        <span className="text-green-600">✓</span>
        <span className="text-[10px]">Sí</span>
      </button>
      <button
        onClick={() => handleVote("maybe")}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
          isMaybe
            ? "bg-yellow-100 text-yellow-700 border border-yellow-200"
            : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
        }`}
        title="Quizás / Tal vez"
      >
        <span className="text-yellow-600">~</span>
        <span className="text-[10px]">Quizás</span>
      </button>
      <button
        onClick={() => handleVote("no")}
        disabled={loading}
        className={`flex items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors ${
          isNo
            ? "bg-red-100 text-red-700 border border-red-200"
            : "bg-white text-zinc-500 border border-zinc-200 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700 dark:hover:bg-zinc-700"
        }`}
        title="No, no me funciona"
      >
        <span className="text-red-600">✗</span>
        <span className="text-[10px]">No</span>
      </button>
    </div>
  );
}
