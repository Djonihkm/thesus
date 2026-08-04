"use client";

import { useState } from "react";
import { MemoireStatus } from "@prisma/client";
import { MemoireCard } from "./MemoireCard";
import { MemoireGridCard } from "./MemoireGridCard";
import { ViewToggle } from "./ViewToggle";

interface MemoireSummary {
  id: string;
  title: string;
  status: MemoireStatus;
  submittedAt: Date;
}

export function MemoiresListSection({ memoires }: { memoires: MemoireSummary[] }) {
  const [view, setView] = useState<"grid" | "list">("grid");

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-medium tracking-[-0.01em] text-ink">Tous mes mémoires</h2>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "grid" ? (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {memoires.map((memoire) => (
            <MemoireGridCard
              key={memoire.id}
              id={memoire.id}
              title={memoire.title}
              status={memoire.status}
              submittedAt={memoire.submittedAt}
            />
          ))}
        </div>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {memoires.map((memoire) => (
            <MemoireCard
              key={memoire.id}
              id={memoire.id}
              title={memoire.title}
              status={memoire.status}
              submittedAt={memoire.submittedAt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
