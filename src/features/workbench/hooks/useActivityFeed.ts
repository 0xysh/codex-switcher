import { useCallback, useRef, useState } from "react";

import type { ActivityEntry } from "../types";

export function useActivityFeed(maxEntries = 8) {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const idRef = useRef(0);

  const pushActivity = useCallback(
    (kind: ActivityEntry["kind"], text: string) => {
      setActivity((previous) => {
        const entry: ActivityEntry = {
          id: Date.now() * 100 + idRef.current,
          kind,
          text,
          createdAt: Date.now(),
        };

        idRef.current += 1;
        return [entry, ...previous].slice(0, maxEntries);
      });
    },
    [maxEntries],
  );

  return {
    activity,
    pushActivity,
  };
}
