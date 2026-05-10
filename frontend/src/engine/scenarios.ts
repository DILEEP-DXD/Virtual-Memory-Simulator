/**
 * Built-in Scenarios
 *
 * Each scenario has a descriptive name, educational note, and a
 * recommended frame count. These mirror the backend JSON scenarios
 * but live client-side for zero-latency setup.
 */

import type { Scenario, Access } from './types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'thrashing',
    name: 'Thrashing',
    description: 'Working set far exceeds available frames — constant page faults.',
    educationalNote:
      'Thrashing occurs when the working set (the set of pages a process actively uses) is larger than the number of available frames. The OS spends more time swapping pages than doing useful work. In real systems, adding RAM or reducing the number of active processes is the fix.',
    recommendedFrames: 3,
    accesses: generateThrashingAccesses(),
  },
  {
    id: 'temporal_locality',
    name: 'Temporal Locality',
    description: 'Recently accessed pages are likely to be accessed again soon.',
    educationalNote:
      'Temporal locality means a page accessed now will probably be accessed again in the near future. Loops, hot variables, and frequently-called functions all exhibit this pattern. LRU exploits temporal locality by keeping recently-used pages in memory.',
    recommendedFrames: 4,
    accesses: generateTemporalLocalityAccesses(),
  },
  {
    id: 'spatial_locality',
    name: 'Spatial Locality',
    description: 'Pages near the current page are accessed in sequence.',
    educationalNote:
      'Spatial locality means if page N is accessed, pages N+1 and N+2 are likely next. Array traversals and sequential file reads exhibit this pattern. All algorithms handle this reasonably well since the working set is predictable.',
    recommendedFrames: 4,
    accesses: generateSpatialLocalityAccesses(),
  },
  {
    id: 'sequential',
    name: 'Sequential Access',
    description: 'Pages accessed in strict order, like reading a file start to end.',
    educationalNote:
      'Sequential access scans through pages one by one. If the number of unique pages exceeds frames, every access is a fault — no algorithm can help. FIFO actually performs well here since it naturally evicts the oldest page, which won\'t be reused.',
    recommendedFrames: 4,
    accesses: generateSequentialAccesses(),
  },
  {
    id: 'random',
    name: 'Random Access',
    description: 'Pages accessed in no particular pattern — worst case for most algorithms.',
    educationalNote:
      'Random access has no locality to exploit. No algorithm can predict which pages will be needed next. Optimal still does best (it cheats with future knowledge), but LRU and FIFO perform similarly. This demonstrates why locality of reference matters so much in real programs.',
    recommendedFrames: 4,
    accesses: generateRandomAccesses(),
  },
];

// ─── Access Generators ───────────────────────────────────────

function a(page: number, write = false): Access {
  return { pid: 1, page, write };
}

function generateThrashingAccesses(): Access[] {
  // 8 unique pages cycling through with only 3 frames → constant faults
  const pages = [0, 1, 2, 3, 4, 5, 6, 7];
  const accesses: Access[] = [];
  for (let cycle = 0; cycle < 5; cycle++) {
    for (const p of pages) {
      accesses.push(a(p));
    }
  }
  return accesses;
}

function generateTemporalLocalityAccesses(): Access[] {
  // Cluster around a few pages, with occasional jumps
  return [
    a(0), a(1), a(0), a(2), a(1), a(0),          // Hot set: 0, 1, 2
    a(3), a(2, true), a(1), a(0),                 // Bring in 3, revisit hot set
    a(2), a(3), a(1), a(2), a(0), a(1),           // More hot set access
    a(3), a(2), a(4), a(3), a(2), a(1),           // Introduce 4 briefly
    a(4), a(3, true), a(2), a(4), a(3), a(1),     // 4 becomes part of hot set
    a(2), a(0), a(1), a(2), a(3), a(4),           // Full cycle
    a(3), a(2), a(1), a(0), a(1), a(2),           // Wind down
  ];
}

function generateSpatialLocalityAccesses(): Access[] {
  // Access nearby pages in clusters, simulating array traversal within structures
  return [
    a(0), a(1), a(2), a(3),        // Sweep pages 0–3
    a(1), a(2), a(3), a(4),        // Slide window forward
    a(2), a(3), a(4), a(5),        // Continue sliding
    a(3), a(4), a(5), a(6),        // Further
    a(0), a(1), a(2), a(3),        // Jump back to start
    a(4), a(5), a(6), a(7),        // Jump to second half
    a(5), a(6), a(7), a(0),        // Wrap around
    a(1), a(2), a(3), a(4),        // Middle sweep
    a(6), a(7), a(0), a(1),        // Another wrap
    a(2), a(3), a(4), a(5),        // Final sweep
  ];
}

function generateSequentialAccesses(): Access[] {
  // Strictly sequential pages 0–9, repeated
  const accesses: Access[] = [];
  for (let cycle = 0; cycle < 4; cycle++) {
    for (let p = 0; p < 10; p++) {
      accesses.push(a(p, p % 5 === 0)); // Occasional writes
    }
  }
  return accesses;
}

function generateRandomAccesses(): Access[] {
  // Deterministic "random" — seeded so results are reproducible
  const pages = [3, 7, 2, 0, 8, 1, 5, 4, 9, 6, 2, 7, 3, 1, 0, 8, 5, 9, 4, 6,
                  1, 3, 7, 0, 2, 8, 6, 5, 9, 4, 7, 1, 3, 0, 2, 6, 8, 5, 4, 9];
  return pages.map((p, i) => a(p, i % 7 === 0));
}

/**
 * Parse a custom reference string into an access sequence.
 *
 * Accepts: "1, 2, 3, 4" or "1 2 3 4" or "1,2,3,4"
 * Returns null if the input can't be parsed.
 */
export function parseReferenceString(input: string): Access[] | null {
  const cleaned = input.trim();
  if (!cleaned) return null;

  // Split by commas, spaces, or both
  const parts = cleaned.split(/[\s,]+/).filter(Boolean);
  const accesses: Access[] = [];

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (isNaN(num) || num < 0) return null;
    accesses.push({ pid: 1, page: num, write: false });
  }

  return accesses.length > 0 ? accesses : null;
}

/**
 * Find a scenario by ID.
 */
export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find(s => s.id === id);
}
