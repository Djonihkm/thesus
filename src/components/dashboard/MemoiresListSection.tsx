"use client";

import { MemoireStatus } from "@prisma/client";
import { MemoireCard } from "./MemoireCard";
import { MemoireGridCard } from "./MemoireGridCard";
import { ToggleableListing } from "./ToggleableListing";

interface MemoireSummary {
  id: string;
  title: string;
  status: MemoireStatus;
  submittedAt: Date;
}

export function MemoiresListSection({ memoires }: { memoires: MemoireSummary[] }) {
  return (
    <ToggleableListing
      items={memoires}
      getKey={(memoire) => memoire.id}
      title="Tous mes mémoires"
      renderGrid={(memoire) => (
        <MemoireGridCard
          id={memoire.id}
          title={memoire.title}
          status={memoire.status}
          submittedAt={memoire.submittedAt}
        />
      )}
      renderList={(memoire) => (
        <MemoireCard
          id={memoire.id}
          title={memoire.title}
          status={memoire.status}
          submittedAt={memoire.submittedAt}
        />
      )}
    />
  );
}
