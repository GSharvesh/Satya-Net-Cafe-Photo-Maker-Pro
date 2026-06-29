import { useState, useCallback } from 'react';
import type {
  PhotoEntry, SheetSettings, HistorySnapshot,
  PaperPresetKey, PackedSlot, SheetLayout, Orientation,
} from '../types';
import {
  PAPER_PRESETS, computeLayout, packQueue, totalPages,
} from '../types';

const DEFAULT_SETTINGS: SheetSettings = {
  backgroundColor: 'white',
  customColor:     '#ffffff',
  showCutMarks:    true,
  darkMode:        true,
  activePaper:     'a4',
  orientation:     'auto',
};

const MAX_HISTORY = 50;

export function usePhotoStore() {
  const [queue,    setQueueRaw] = useState<PhotoEntry[]>([]);
  const [settings, setSettings] = useState<SheetSettings>(DEFAULT_SETTINGS);
  const [history,  setHistory]  = useState<HistorySnapshot[]>([]);
  const [future,   setFuture]   = useState<HistorySnapshot[]>([]);

  // ── snapshot helpers ──────────────────────────────────────────────────────
  const snapshot = (q: PhotoEntry[]): HistorySnapshot => ({ queue: q });

  const pushHistory = useCallback((prev: PhotoEntry[]) => {
    setHistory(h => [...h.slice(-MAX_HISTORY), snapshot(prev)]);
    setFuture([]);
  }, []);

  // ── queue mutations ───────────────────────────────────────────────────────
  const setQueue = useCallback((updater: (q: PhotoEntry[]) => PhotoEntry[]) => {
    setQueueRaw(prev => {
      pushHistory(prev);
      return updater(prev);
    });
  }, [pushHistory]);

  const addEntry = useCallback((entry: PhotoEntry) => {
    setQueue(q => [...q, entry]);
  }, [setQueue]);

  const updateEntry = useCallback((id: string, patch: Partial<PhotoEntry>) => {
    setQueue(q => q.map(e => e.id === id ? { ...e, ...patch } : e));
  }, [setQueue]);

  const removeEntry = useCallback((id: string) => {
    setQueue(q => q.filter(e => e.id !== id));
  }, [setQueue]);

  const duplicateEntry = useCallback((id: string) => {
    setQueue(q => {
      const src = q.find(e => e.id === id);
      if (!src) return q;
      const clone: PhotoEntry = { ...src, id: crypto.randomUUID() };
      const idx  = q.findIndex(e => e.id === id);
      const next = [...q];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, [setQueue]);

  const reorderEntry = useCallback((fromIdx: number, toIdx: number) => {
    setQueue(q => {
      const next = [...q];
      const [item] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, item);
      return next;
    });
  }, [setQueue]);

  // ── undo / redo ───────────────────────────────────────────────────────────
  const undo = useCallback(() => {
    setHistory(h => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setFuture(f => [snapshot(queue), ...f]);
      setQueueRaw(prev.queue);
      return h.slice(0, -1);
    });
  }, [queue]);

  const redo = useCallback(() => {
    setFuture(f => {
      if (f.length === 0) return f;
      const next = f[0];
      setHistory(h => [...h, snapshot(queue)]);
      setQueueRaw(next.queue);
      return f.slice(1);
    });
  }, [queue]);

  // ── settings ──────────────────────────────────────────────────────────────
  const patchSettings = useCallback((patch: Partial<SheetSettings>) => {
    setSettings(s => ({ ...s, ...patch }));
  }, []);

  const setPaper = useCallback((key: PaperPresetKey) => {
    setSettings(s => ({ ...s, activePaper: key }));
  }, []);

  const setOrientation = useCallback((o: Orientation) => {
    setSettings(s => ({ ...s, orientation: o }));
  }, []);

  // ── derived layout data ───────────────────────────────────────────────────
  const paper      = PAPER_PRESETS[settings.activePaper];
  const basePhoto  = queue.length > 0
    ? queue[0].photoSize
    : { widthMm: 35, heightMm: 45, label: '' };

  const orientation = settings.orientation;
  const layout: SheetLayout   = computeLayout(paper, basePhoto, orientation);
  const slots: PackedSlot[]   = packQueue(queue, paper, orientation);
  const numPages: number      = totalPages(queue, paper, orientation);
  const totalCopies: number   = queue.reduce((s, e) => s + e.copies, 0);

  return {
    queue, settings, layout, slots, paper, numPages, totalCopies,
    addEntry, updateEntry, removeEntry, duplicateEntry, reorderEntry,
    undo, redo, canUndo: history.length > 0, canRedo: future.length > 0,
    patchSettings, setPaper, setOrientation,
  };
}

export type PhotoStore = ReturnType<typeof usePhotoStore>;
