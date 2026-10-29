import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

export interface WatchInfo {
  title: string;
  description: string;
  action_steps: string[];
  common_mistakes: string[];
  pdd_refs: string[];
}

interface WatchCtx {
  watching: WatchInfo | null;
  setWatching: (w: WatchInfo | null) => void;
}

const Ctx = createContext<WatchCtx>({ watching: null, setWatching: () => {} });

export function WatchProvider({ children }: { children: ReactNode }) {
  const [watching, setW] = useState<WatchInfo | null>(null);
  const setWatching = useCallback((w: WatchInfo | null) => setW(w), []);
  const value = useMemo(() => ({ watching, setWatching }), [watching, setWatching]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWatch() {
  return useContext(Ctx);
}
