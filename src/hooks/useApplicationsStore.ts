"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { getDB } from "@/lib/db";
import { APP_CONFIG } from "@/lib/config";
import { now } from "@/lib/utils";
import type {
  ApplicationRecord,
  ApplicationStatus,
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/lib/types";

// ─── Store State ──────────────────────────────────────────────────────────────

interface StoreState {
  applications: ApplicationRecord[];
  loading: boolean;
  error: string | null;
}

// ─── Application Locking Guard ────────────────────────────────────────────────

/**
 * When an application is "applied", certain fields become immutable.
 * This function enforces those constraints before any update is persisted.
 */
function enforceImmutability(
  existing: ApplicationRecord,
  update: UpdateApplicationInput
): UpdateApplicationInput {
  if (existing.status !== "applied") return update;

  const safe = { ...update };
  // Lock these fields on applied applications
  delete safe.resume_json;
  delete safe.score;
  delete safe.prompts;

  return safe;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApplicationsStore() {
  const [state, setState] = useState<StoreState>({
    applications: [],
    loading: false,
    error: null,
  });

  const setLoading = (loading: boolean) =>
    setState((s) => ({ ...s, loading }));

  const setError = (error: string | null) =>
    setState((s) => ({ ...s, error }));

  // ── Read All ──────────────────────────────────────────────────────────────

  const getApplications = useCallback(async (): Promise<ApplicationRecord[]> => {
    setLoading(true);
    setError(null);
    try {
      const db = getDB();
      const apps = await db.applications
        .orderBy("created_at")
        .reverse()
        .toArray();
      setState((s) => ({ ...s, applications: apps, loading: false }));
      return apps;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load applications";
      setError(msg);
      setLoading(false);
      return [];
    }
  }, []);

  // ── Read One ──────────────────────────────────────────────────────────────

  const getApplicationById = useCallback(
    async (id: string): Promise<ApplicationRecord | undefined> => {
      try {
        const db = getDB();
        return await db.applications.get(id);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to get application";
        setError(msg);
        return undefined;
      }
    },
    []
  );

  // ── Create ────────────────────────────────────────────────────────────────

  const createApplication = useCallback(
    async (input: CreateApplicationInput): Promise<ApplicationRecord> => {
      setLoading(true);
      setError(null);
      try {
        const db = getDB();
        const record: ApplicationRecord = {
          id: uuidv4(),
          company: input.company.trim(),
          role: input.role.trim(),
          job_description: input.job_description.trim(),
          status: APP_CONFIG.DEFAULT_STATUS,
          prompts: {},
          created_at: now(),
          updated_at: now(),
        };
        await db.applications.add(record);
        setState((s) => ({
          ...s,
          applications: [record, ...s.applications],
          loading: false,
        }));
        return record;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to create application";
        setError(msg);
        setLoading(false);
        throw err;
      }
    },
    []
  );

  // ── Update ────────────────────────────────────────────────────────────────

  const updateApplication = useCallback(
    async (
      id: string,
      update: UpdateApplicationInput
    ): Promise<ApplicationRecord> => {
      setLoading(true);
      setError(null);
      try {
        const db = getDB();
        const existing = await db.applications.get(id);
        if (!existing) throw new Error(`Application ${id} not found`);

        const safeUpdate = enforceImmutability(existing, update);
        const updated: ApplicationRecord = {
          ...existing,
          ...safeUpdate,
          id,
          created_at: existing.created_at,
          updated_at: now(),
        };

        await db.applications.put(updated);
        setState((s) => ({
          ...s,
          applications: s.applications.map((a) => (a.id === id ? updated : a)),
          loading: false,
        }));
        return updated;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to update application";
        setError(msg);
        setLoading(false);
        throw err;
      }
    },
    []
  );

  // ── Delete ────────────────────────────────────────────────────────────────

  const deleteApplication = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const db = getDB();
      await db.applications.delete(id);
      setState((s) => ({
        ...s,
        applications: s.applications.filter((a) => a.id !== id),
        loading: false,
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete application";
      setError(msg);
      setLoading(false);
      throw err;
    }
  }, []);

  // ── Status Transition ──────────────────────────────────────────────────────

  const setStatus = useCallback(
    async (
      id: string,
      status: ApplicationStatus
    ): Promise<ApplicationRecord> => {
      const extra: Partial<ApplicationRecord> =
        status === "applied" ? { applied_at: now() } : {};
      return updateApplication(id, { status, ...extra });
    },
    [updateApplication]
  );

  // ── Notion Sync ────────────────────────────────────────────────────────────

  const markNotionSynced = useCallback(
    async (id: string, notionPageId: string): Promise<void> => {
      await updateApplication(id, {
        notion_synced: true,
        notion_page_id: notionPageId,
      });
    },
    [updateApplication]
  );

  return {
    // State
    applications: state.applications,
    loading: state.loading,
    error: state.error,
    // Actions
    getApplications,
    getApplicationById,
    createApplication,
    updateApplication,
    deleteApplication,
    setStatus,
    markNotionSynced,
    // Direct state setter for local error clearing
    clearError: () => setError(null),
  };
}
