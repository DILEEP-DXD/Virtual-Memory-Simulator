/**
 * Page Replacement Algorithms — FIFO, LRU, Optimal, Clock
 *
 * Each algorithm implements PageReplacementAlgorithm.
 * The key feature: selectVictim() returns a human-readable explanation
 * of WHY it chose that page, making this an educational tool, not just a simulator.
 */

import type {
  PageReplacementAlgorithm,
  AlgorithmId,
  AlgorithmInfo,
  FrameState,
  Access,
  VictimSelection,
} from './types';

// ─── Algorithm Metadata ──────────────────────────────────────

export const ALGORITHM_INFO: Record<AlgorithmId, AlgorithmInfo> = {
  fifo: {
    id: 'fifo',
    name: 'First-In, First-Out',
    shortName: 'FIFO',
    description: 'Evicts the page that has been in memory the longest, regardless of how recently or frequently it was used.',
    strategy: 'Evicts the oldest page in memory.',
  },
  lru: {
    id: 'lru',
    name: 'Least Recently Used',
    shortName: 'LRU',
    description: 'Evicts the page that has not been accessed for the longest time. Good for workloads with temporal locality.',
    strategy: 'Evicts the page unused for the longest time.',
  },
  optimal: {
    id: 'optimal',
    name: 'Optimal (Bélády\'s)',
    shortName: 'Optimal',
    description: 'Evicts the page that won\'t be needed for the longest time in the future. Theoretical best — requires future knowledge.',
    strategy: 'Evicts the page needed farthest in the future.',
  },
  clock: {
    id: 'clock',
    name: 'Clock (Second Chance)',
    shortName: 'Clock',
    description: 'Approximates LRU using a reference bit and circular sweep. Efficient to implement in real hardware.',
    strategy: 'Sweeps a clock hand, giving referenced pages a second chance.',
  },
};

// ─── FIFO ────────────────────────────────────────────────────

class FIFOAlgorithm implements PageReplacementAlgorithm {
  id: AlgorithmId = 'fifo';
  private queue: number[] = []; // Frame indices in insertion order

  initialize(_numFrames: number, _allAccesses: Access[]): void {
    this.queue = [];
  }

  selectVictim(frames: FrameState[], _currentStep: number): VictimSelection {
    // The first frame in the queue is the oldest
    const victimFrame = this.queue[0];
    const frame = frames[victimFrame];
    const loadedStep = frame.loadedAtStep;

    return {
      frameIndex: victimFrame,
      explanation: `Page ${frame.page} was evicted because it was the oldest page in memory (loaded at step ${loadedStep}). FIFO always removes the page that has been in memory the longest, regardless of how recently it was used.`,
    };
  }

  onAccess(_frameIndex: number, _step: number): void {
    // FIFO doesn't care about access patterns — only insertion order
  }

  onPageIn(frameIndex: number, _step: number): void {
    // Remove if already in queue (shouldn't happen, but safe)
    const idx = this.queue.indexOf(frameIndex);
    if (idx !== -1) this.queue.splice(idx, 1);
    this.queue.push(frameIndex);
  }

  reset(): void {
    this.queue = [];
  }

  getState(): any {
    return { queue: [...this.queue] };
  }
}

// ─── LRU ─────────────────────────────────────────────────────

class LRUAlgorithm implements PageReplacementAlgorithm {
  id: AlgorithmId = 'lru';
  private lastAccess: Map<number, number> = new Map(); // frameIndex → step

  initialize(_numFrames: number, _allAccesses: Access[]): void {
    this.lastAccess = new Map();
  }

  selectVictim(frames: FrameState[], _currentStep: number): VictimSelection {
    let victimFrame = -1;
    let oldestAccess = Infinity;

    // Find the frame with the smallest (oldest) last access time
    for (const frame of frames) {
      if (frame.page === null) continue;
      const lastStep = this.lastAccess.get(frame.frameId) ?? 0;
      if (lastStep < oldestAccess) {
        oldestAccess = lastStep;
        victimFrame = frame.frameId;
      }
    }

    const frame = frames[victimFrame];

    // Build explanation showing why this page was chosen over others
    const others = frames
      .filter(f => f.page !== null && f.frameId !== victimFrame)
      .map(f => `Page ${f.page} (last used at step ${this.lastAccess.get(f.frameId) ?? 0})`)
      .join(', ');

    return {
      frameIndex: victimFrame,
      explanation: `Page ${frame.page} was evicted because it was last accessed at step ${oldestAccess}, making it the least recently used. Other pages in memory: ${others}.`,
    };
  }

  onAccess(frameIndex: number, step: number): void {
    this.lastAccess.set(frameIndex, step);
  }

  onPageIn(frameIndex: number, step: number): void {
    this.lastAccess.set(frameIndex, step);
  }

  reset(): void {
    this.lastAccess = new Map();
  }

  getState(): any {
    // Return array of frame indices sorted by last access (least recent first)
    const sorted = Array.from(this.lastAccess.entries())
      .sort((a, b) => a[1] - b[1])
      .map(entry => entry[0]);
    return { lruOrder: sorted };
  }
}

// ─── Optimal (Bélády's) ─────────────────────────────────────

class OptimalAlgorithm implements PageReplacementAlgorithm {
  id: AlgorithmId = 'optimal';
  private futureAccesses: Access[] = [];

  initialize(_numFrames: number, allAccesses: Access[]): void {
    this.futureAccesses = allAccesses;
  }

  selectVictim(frames: FrameState[], currentStep: number): VictimSelection {
    let victimFrame = -1;
    let farthestUse = -1;
    let victimNeverUsed = false;

    for (const frame of frames) {
      if (frame.page === null) continue;

      // Find next future use of this page (steps are 1-indexed, array is 0-indexed)
      let nextUse = Infinity;
      for (let i = currentStep; i < this.futureAccesses.length; i++) {
        const future = this.futureAccesses[i];
        if (future.pid === frame.pid && future.page === frame.page) {
          nextUse = i + 1; // Convert to 1-indexed step
          break;
        }
      }

      if (nextUse > farthestUse) {
        farthestUse = nextUse;
        victimFrame = frame.frameId;
        victimNeverUsed = nextUse === Infinity;
      }
    }

    const frame = frames[victimFrame];

    // Build explanation
    let explanation: string;
    if (victimNeverUsed) {
      explanation = `Page ${frame.page} was evicted because it will never be accessed again in the remaining sequence. Optimal always removes the page that won't be needed for the longest time.`;
    } else {
      const othersInfo = frames
        .filter(f => f.page !== null && f.frameId !== victimFrame)
        .map(f => {
          let next = 'never';
          for (let i = currentStep; i < this.futureAccesses.length; i++) {
            if (this.futureAccesses[i].pid === f.pid && this.futureAccesses[i].page === f.page) {
              next = `step ${i + 1}`;
              break;
            }
          }
          return `Page ${f.page} (next use: ${next})`;
        })
        .join(', ');

      explanation = `Page ${frame.page} was evicted because it won't be needed until step ${farthestUse}, the farthest future use among all pages. Other pages: ${othersInfo}.`;
    }

    return { frameIndex: victimFrame, explanation };
  }

  onAccess(_frameIndex: number, _step: number): void {
    // Optimal doesn't need to track access — it uses the full future sequence
  }

  onPageIn(_frameIndex: number, _step: number): void {
    // No tracking needed
  }

  reset(): void {
    this.futureAccesses = [];
  }

  getState(): any {
    // Just return remaining future accesses
    return { futureAccesses: this.futureAccesses };
  }
}

// ─── Clock (Second Chance) ───────────────────────────────────

class ClockAlgorithm implements PageReplacementAlgorithm {
  id: AlgorithmId = 'clock';
  private hand: number = 0;
  private numFrames: number = 0;
  // Track reference bits ourselves for accurate explanation
  private refBits: Map<number, boolean> = new Map();

  initialize(numFrames: number, _allAccesses: Access[]): void {
    this.hand = 0;
    this.numFrames = numFrames;
    this.refBits = new Map();
  }

  selectVictim(frames: FrameState[], _currentStep: number): VictimSelection {
    const sweepLog: string[] = [];
    let checked = 0;

    // Sweep at most 2 full cycles
    while (checked < this.numFrames * 2) {
      const frame = frames[this.hand];

      if (frame.page === null) {
        // Free frame — shouldn't happen since selectVictim is only called when full
        const result = this.hand;
        this.hand = (this.hand + 1) % this.numFrames;
        return {
          frameIndex: result,
          explanation: `Frame ${result} was empty and selected directly.`,
        };
      }

      const isReferenced = this.refBits.get(this.hand) ?? false;

      if (isReferenced) {
        // Give second chance: clear reference bit and move on
        sweepLog.push(`Frame ${this.hand} (Page ${frame.page}): referenced → gave second chance`);
        this.refBits.set(this.hand, false);
        this.hand = (this.hand + 1) % this.numFrames;
        checked++;
      } else {
        // Not referenced — this is our victim
        sweepLog.push(`Frame ${this.hand} (Page ${frame.page}): not referenced → evicted`);
        const victimFrame = this.hand;
        this.hand = (this.hand + 1) % this.numFrames;

        const sweepDesc = sweepLog.length > 1
          ? `The clock hand examined: ${sweepLog.join('; ')}.`
          : `The clock hand found Page ${frame.page} at Frame ${victimFrame} with reference bit = 0 and evicted it.`;

        return {
          frameIndex: victimFrame,
          explanation: `${sweepDesc} Clock gives referenced pages a "second chance" by clearing their reference bit and moving on.`,
        };
      }
    }

    // Fallback after 2 full cycles — evict at current hand
    const fallback = this.hand;
    this.hand = (this.hand + 1) % this.numFrames;
    return {
      frameIndex: fallback,
      explanation: `After a full sweep, all pages had reference bits set. Frame ${fallback} (Page ${frames[fallback].page}) was evicted as a fallback.`,
    };
  }

  onAccess(frameIndex: number, _step: number): void {
    // Set reference bit on access (simulates hardware setting the R bit)
    this.refBits.set(frameIndex, true);
  }

  onPageIn(frameIndex: number, _step: number): void {
    // New pages start with reference bit set
    this.refBits.set(frameIndex, true);
  }

  reset(): void {
    this.hand = 0;
    this.refBits = new Map();
  }

  getState(): any {
    const bits: Record<number, boolean> = {};
    for (let i = 0; i < this.numFrames; i++) {
      bits[i] = this.refBits.get(i) ?? false;
    }
    return { hand: this.hand, refBits: bits };
  }
}

// ─── Factory ─────────────────────────────────────────────────

export function createAlgorithm(id: AlgorithmId): PageReplacementAlgorithm {
  switch (id) {
    case 'fifo': return new FIFOAlgorithm();
    case 'lru': return new LRUAlgorithm();
    case 'optimal': return new OptimalAlgorithm();
    case 'clock': return new ClockAlgorithm();
  }
}
