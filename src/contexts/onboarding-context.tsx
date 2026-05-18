"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPerson } from "@/lib/onboarding/person-utils";
import type {
  BarrierId,
  OnboardingState,
  PersonChip,
} from "@/lib/onboarding/types";
export type { BarrierId, OnboardingState, PersonChip };

const STORAGE_KEY = "kinmatch-onboarding";

const defaultState: OnboardingState = {
  q1People: [],
  q2People: [],
  q3Barriers: [],
  watchers: [],
};

type OnboardingContextValue = OnboardingState & {
  hydrated: boolean;
  setQ1People: React.Dispatch<React.SetStateAction<PersonChip[]>>;
  setQ2People: React.Dispatch<React.SetStateAction<PersonChip[]>>;
  addQ1Person: (name: string) => boolean;
  addQ2Person: (name: string) => boolean;
  removeQ1Person: (id: string) => void;
  removeQ2Person: (id: string) => void;
  toggleBarrier: (id: BarrierId) => void;
  setWatchers: (watchers: string[]) => void;
  toggleWatcher: (personId: string) => void;
  resetOnboarding: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

function migrateLegacyState(parsed: Record<string, unknown>): OnboardingState {
  const q1Names = (parsed.q1Names as string[] | undefined) ?? [];
  const q2Names = (parsed.q2Names as string[] | undefined) ?? [];
  const q3Barriers = (parsed.q3Barriers as BarrierId[] | undefined) ?? [];
  const watchers = (parsed.watchers as string[] | undefined) ?? [];

  return {
    q1People: q1Names.map((name) => createPerson(name)),
    q2People: q2Names.map((name) => createPerson(name)),
    q3Barriers,
    watchers,
  };
}

function loadState(): OnboardingState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (Array.isArray(parsed.q1People)) {
      return { ...defaultState, ...parsed } as OnboardingState;
    }
    return migrateLegacyState(parsed);
  } catch {
    return defaultState;
  }
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<OnboardingState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const setQ1People = useCallback(
    (value: React.SetStateAction<PersonChip[]>) => {
      setState((s) => ({
        ...s,
        q1People: typeof value === "function" ? value(s.q1People) : value,
      }));
    },
    []
  );

  const setQ2People = useCallback(
    (value: React.SetStateAction<PersonChip[]>) => {
      setState((s) => ({
        ...s,
        q2People: typeof value === "function" ? value(s.q2People) : value,
      }));
    },
    []
  );

  const addQ1Person = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return false;
    let added = false;
    setState((s) => {
      if (s.q1People.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
        return s;
      }
      added = true;
      return { ...s, q1People: [...s.q1People, createPerson(trimmed)] };
    });
    return added;
  }, []);

  const addQ2Person = useCallback((name: string) => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return false;
    let added = false;
    setState((s) => {
      const lower = trimmed.toLowerCase();
      if (s.q2People.some((p) => p.name.toLowerCase() === lower)) {
        return s;
      }
      const fromQ1 = s.q1People.find((p) => p.name.toLowerCase() === lower);
      added = true;
      return {
        ...s,
        q2People: [...s.q2People, fromQ1 ?? createPerson(trimmed)],
      };
    });
    return added;
  }, []);

  const removeQ1Person = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      q1People: s.q1People.filter((p) => p.id !== id),
    }));
  }, []);

  const removeQ2Person = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      q2People: s.q2People.filter((p) => p.id !== id),
    }));
  }, []);

  const toggleBarrier = useCallback((id: BarrierId) => {
    setState((s) => {
      const has = s.q3Barriers.includes(id);
      return {
        ...s,
        q3Barriers: has
          ? s.q3Barriers.filter((b) => b !== id)
          : [...s.q3Barriers, id],
      };
    });
  }, []);

  const setWatchers = useCallback((watchers: string[]) => {
    setState((s) => ({ ...s, watchers }));
  }, []);

  const toggleWatcher = useCallback((personId: string) => {
    setState((s) => {
      const has = s.watchers.includes(personId);
      if (has) {
        return {
          ...s,
          watchers: s.watchers.filter((id) => id !== personId),
        };
      }
      if (s.watchers.length >= 2) {
        return s;
      }
      return { ...s, watchers: [...s.watchers, personId] };
    });
  }, []);

  const resetOnboarding = useCallback(() => {
    setState(defaultState);
    sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      setQ1People,
      setQ2People,
      addQ1Person,
      addQ2Person,
      removeQ1Person,
      removeQ2Person,
      toggleBarrier,
      setWatchers,
      toggleWatcher,
      resetOnboarding,
    }),
    [
      state,
      hydrated,
      setQ1People,
      setQ2People,
      addQ1Person,
      addQ2Person,
      removeQ1Person,
      removeQ2Person,
      toggleBarrier,
      setWatchers,
      toggleWatcher,
      resetOnboarding,
    ]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
}
