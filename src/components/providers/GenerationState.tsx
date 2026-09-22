"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { apiFetch } from "@/lib/api";
import { publicErrorMessage } from "@/lib/errors";
import type { CreateMode } from "@/components/create/CreateModeToggle";
import type {
  GenerationJob,
  GenerationSettings,
  GenerationStatus,
  VideoWithCreator,
  Visibility,
} from "@/types";
import { useAppState } from "./AppState";
import { useToast } from "@/components/ui/Toast";

const STORAGE_KEY = "gener8_generation";
const IN_FLIGHT = new Set([
  "queued",
  "preparing",
  "generating",
  "processing",
]);

export type GenerationDraft = {
  mode: CreateMode;
  selectedPresetId: string | null;
  settings: GenerationSettings;
  prompt: string;
  title: string;
  visibility: Visibility;
};

export type GenerationSnapshot = {
  job: GenerationJob | null;
  video: VideoWithCreator | null;
  status: GenerationStatus | "idle";
  startedAt: number | null;
  busy: boolean;
  draft: GenerationDraft | null;
  userId: string | null;
};

const EMPTY: GenerationSnapshot = {
  job: null,
  video: null,
  status: "idle",
  startedAt: null,
  busy: false,
  draft: null,
  userId: null,
};

interface GenerationContextValue extends GenerationSnapshot {
  generating: boolean;
  markBusy: (draft: GenerationDraft) => void;
  start: (input: {
    job: GenerationJob;
    video: VideoWithCreator;
    status: GenerationStatus;
    draft: GenerationDraft;
  }) => void;
  fail: (draft?: GenerationDraft | null) => void;
  cancel: () => void;
  finish: () => void;
  patch: (partial: Partial<GenerationSnapshot>) => void;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

function readStorage(): GenerationSnapshot {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as GenerationSnapshot;
    if (!parsed || typeof parsed !== "object") return EMPTY;
    return {
      ...EMPTY,
      ...parsed,
      startedAt:
        typeof parsed.startedAt === "number" ? parsed.startedAt : null,
    };
  } catch {
    return EMPTY;
  }
}

function writeStorage(state: GenerationSnapshot) {
  if (typeof window === "undefined") return;
  if (state.status === "idle" && !state.busy && !state.job) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAppState();
  const { toast } = useToast();
  const [state, setState] = useState<GenerationSnapshot>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(state);
  }, [state, hydrated]);

  useEffect(() => {
    const userId = session?.userId ?? null;
    if (!userId) {
      if (state.userId) setState(EMPTY);
      return;
    }
    if (state.userId && state.userId !== userId) setState(EMPTY);
  }, [session?.userId, state.userId]);

  useEffect(() => {
    if (!state.job || !IN_FLIGHT.has(state.status)) return;
    const jobId = state.job.id;
    const t = window.setInterval(async () => {
      try {
        const res = await apiFetch(`/api/generate/${jobId}`);
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          if (data?.code === "GENERATION_FAILED" || data?.code === "UPLOAD_FAILED") {
            setState((current) => ({
              ...current,
              status: "failed",
              busy: false,
            }));
            toast(data.error ?? publicErrorMessage("GENERATION_FAILED"), "error");
          }
          return;
        }
        setState((current) => ({
          ...current,
          job: data.job,
          video: data.video,
          status: data.job.status,
          busy: IN_FLIGHT.has(data.job.status),
        }));
        if (data.job.status === "failed") {
          toast(
            data.job.errorMessage ??
              data.video?.errorMessage ??
              publicErrorMessage("GENERATION_FAILED"),
            "error",
          );
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return () => window.clearInterval(t);
  }, [state.job?.id, state.status, toast]);

  const markBusy = useCallback((draft: GenerationDraft) => {
    setState((current) => ({
      ...current,
      busy: true,
      status:
        current.status === "idle" || current.status === "complete"
          ? "preparing"
          : current.status,
      startedAt:
        current.status === "idle" ||
        current.status === "complete" ||
        current.status === "failed"
          ? Date.now()
          : current.startedAt ?? Date.now(),
      draft,
      userId: session?.userId ?? current.userId,
    }));
  }, [session?.userId]);

  const start = useCallback(
    (input: {
      job: GenerationJob;
      video: VideoWithCreator;
      status: GenerationStatus;
      draft: GenerationDraft;
    }) => {
      setState((current) => ({
        job: input.job,
        video: input.video,
        status: input.status,
        startedAt: current.startedAt ?? Date.now(),
        busy: IN_FLIGHT.has(input.status),
        draft: input.draft,
        userId: input.job.userId,
      }));
    },
    [],
  );

  const fail = useCallback((draft?: GenerationDraft | null) => {
    setState((current) => ({
      ...current,
      status: "failed",
      busy: false,
      job: null,
      draft: draft === undefined ? current.draft : draft,
    }));
  }, []);

  const cancel = useCallback(() => {
    setState((current) => ({
      ...current,
      busy: false,
      job: null,
      status: "failed",
    }));
  }, []);

  const finish = useCallback(() => {
    setState(EMPTY);
  }, []);

  const patch = useCallback((partial: Partial<GenerationSnapshot>) => {
    setState((current) => ({ ...current, ...partial }));
  }, []);

  const generating =
    state.busy ||
    state.status === "queued" ||
    state.status === "preparing" ||
    state.status === "generating" ||
    state.status === "processing";

  const value = useMemo(
    () => ({
      ...state,
      generating,
      markBusy,
      start,
      fail,
      cancel,
      finish,
      patch,
    }),
    [state, generating, markBusy, start, fail, cancel, finish, patch],
  );

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration() {
  const ctx = useContext(GenerationContext);
  if (!ctx) throw new Error("useGeneration must be used within GenerationProvider");
  return ctx;
}
