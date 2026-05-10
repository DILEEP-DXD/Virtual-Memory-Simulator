/**
 * Simulation Engine
 *
 * Takes an algorithm ID, frame count, and access sequence.
 * Returns a complete SimulationResult with step-by-step state.
 *
 * This runs entirely client-side — no backend dependency.
 */

import type {
  AlgorithmId,
  Access,
  FrameState,
  SimulationStep,
  SimulationResult,
} from './types';
import { createAlgorithm } from './algorithms';

/**
 * Create a fresh empty frame state.
 */
function createEmptyFrame(frameId: number): FrameState {
  return {
    frameId,
    page: null,
    pid: null,
    dirty: false,
    referenced: false,
    loadedAtStep: 0,
    lastAccessedAtStep: 0,
  };
}

/**
 * Deep-clone frames array so each step has an independent snapshot.
 */
function cloneFrames(frames: FrameState[]): FrameState[] {
  return frames.map(f => ({ ...f }));
}

/**
 * Find which frame (if any) holds the given page for the given process.
 * Returns the frame index, or -1 if not found.
 */
function findPage(frames: FrameState[], pid: number, page: number): number {
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].pid === pid && frames[i].page === page) {
      return i;
    }
  }
  return -1;
}

/**
 * Find a free (empty) frame. Returns the frame index, or -1 if all occupied.
 */
function findFreeFrame(frames: FrameState[]): number {
  for (let i = 0; i < frames.length; i++) {
    if (frames[i].page === null) return i;
  }
  return -1;
}

/**
 * Run a complete simulation.
 *
 * @param algorithmId - Which page replacement algorithm to use
 * @param numFrames - Number of physical memory frames
 * @param accesses - Sequence of page accesses
 * @returns SimulationResult with all steps, stats, and explanations
 */
export function runSimulation(
  algorithmId: AlgorithmId,
  numFrames: number,
  accesses: Access[],
): SimulationResult {
  const algorithm = createAlgorithm(algorithmId);
  algorithm.initialize(numFrames, accesses);

  // Initialize physical memory — all frames empty
  const frames: FrameState[] = [];
  for (let i = 0; i < numFrames; i++) {
    frames.push(createEmptyFrame(i));
  }

  const steps: SimulationStep[] = [];
  let totalFaults = 0;
  let totalHits = 0;
  let totalEvictions = 0;

  for (let i = 0; i < accesses.length; i++) {
    const access = accesses[i];
    const stepNumber = i + 1; // 1-indexed

    // Check if page is already in memory
    const existingFrame = findPage(frames, access.pid, access.page);

    if (existingFrame !== -1) {
      // ─── HIT ─────────────────────────────────────────
      totalHits++;

      // Update frame state
      frames[existingFrame].referenced = true;
      frames[existingFrame].lastAccessedAtStep = stepNumber;
      if (access.write) {
        frames[existingFrame].dirty = true;
      }

      // Notify algorithm
      algorithm.onAccess(existingFrame, stepNumber);

      steps.push({
        step: stepNumber,
        access,
        frames: cloneFrames(frames),
        hit: true,
        pageFault: false,
        evictedPage: null,
        evictedPid: null,
        evictedDirty: false,
        loadedIntoFrame: existingFrame,
        explanation: `Page ${access.page} was already in Frame ${existingFrame} — no page fault. ${access.write ? 'This was a write access, so the dirty bit is now set.' : ''}`.trim(),
        internalState: algorithm.getState(),
        cumulativeStats: {
          faults: totalFaults,
          hits: totalHits,
          hitRatio: totalHits / stepNumber,
          evictions: totalEvictions,
        },
      });
    } else {
      // ─── PAGE FAULT ──────────────────────────────────
      totalFaults++;

      let evictedPage: number | null = null;
      let evictedPid: number | null = null;
      let evictedDirty = false;
      let targetFrame: number;
      let explanation: string;

      // Try to find a free frame first
      const freeFrame = findFreeFrame(frames);

      if (freeFrame !== -1) {
        // Free frame available — no eviction needed
        targetFrame = freeFrame;
        explanation = `Page ${access.page} was not in memory (page fault). Frame ${targetFrame} was empty, so the page was loaded directly — no eviction needed.`;
      } else {
        // All frames occupied — must evict
        totalEvictions++;
        const victim = algorithm.selectVictim(frames, stepNumber);
        targetFrame = victim.frameIndex;

        // Record eviction info before overwriting
        evictedPage = frames[targetFrame].page;
        evictedPid = frames[targetFrame].pid;
        evictedDirty = frames[targetFrame].dirty;

        explanation = `Page ${access.page} was not in memory (page fault). ${victim.explanation}${evictedDirty ? ' The evicted page was dirty, so it had to be written back to disk first.' : ''}`;
      }

      // Load new page into frame
      frames[targetFrame] = {
        frameId: targetFrame,
        page: access.page,
        pid: access.pid,
        dirty: access.write,
        referenced: true,
        loadedAtStep: stepNumber,
        lastAccessedAtStep: stepNumber,
      };

      // Notify algorithm
      algorithm.onPageIn(targetFrame, stepNumber);

      steps.push({
        step: stepNumber,
        access,
        frames: cloneFrames(frames),
        hit: false,
        pageFault: true,
        evictedPage,
        evictedPid,
        evictedDirty,
        loadedIntoFrame: targetFrame,
        explanation,
        internalState: algorithm.getState(),
        cumulativeStats: {
          faults: totalFaults,
          hits: totalHits,
          hitRatio: totalHits / stepNumber,
          evictions: totalEvictions,
        },
      });
    }
  }

  return {
    steps,
    algorithm: algorithmId,
    numFrames,
    totalAccesses: accesses.length,
    totalFaults,
    totalHits,
    hitRatio: accesses.length > 0 ? totalHits / accesses.length : 0,
    totalEvictions,
  };
}
