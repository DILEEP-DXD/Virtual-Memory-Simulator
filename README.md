# Virtual Memory Simulator

> A modern, interactive educational platform designed for Operating Systems coursework (Unit V: Memory Management).

![Virtual Memory Simulator](https://img.shields.io/badge/Status-Complete-success)
![React](https://img.shields.io/badge/React-18-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)

The **Virtual Memory Simulator** is an interactive, browser-based pedagogical tool built to help students visualize and understand how modern operating systems manage memory. Moving beyond traditional command-line simulators, this project provides a step-by-step visual pipeline of the entire demand paging process.

## 🎓 Educational Focus

This simulator is specifically aligned with standard university Operating System syllabi to demonstrate:

- **Memory Hierarchy**: Visualizing the speed vs. capacity tradeoffs from CPU Registers down to Disk.
- **Address Translation**: How Logical Addresses map to Physical Addresses via the Page Table.
- **Demand Paging**: A live pipeline showing `CPU Request → Page Table → Page Fault → Disk Fetch → Frame Load`.
- **Page Replacement**: Visualizing the internal data structures of 4 distinct algorithms.
- **Locality of Reference**: Custom scenarios demonstrating why certain algorithms excel with spatial/temporal locality.
- **Thrashing**: Demonstrating system behavior when the working set exceeds physical frames.

## ⚙️ Algorithms Implemented

The simulator includes a custom client-side engine supporting four core page replacement algorithms:

1. **FIFO (First-In, First-Out)**: Visualized with an active queue array shifting over time.
2. **LRU (Least Recently Used)**: Visualized with a recency stack showing exactly which pages are hot and which are cold.
3. **Optimal (Bélády's Algorithm)**: Visualized with a future lookahead array, demonstrating the theoretical ceiling of page replacement.
4. **Clock (Second Chance)**: Visualized with dynamic Reference Bits (`R=1/0`) and a sweeping Clock Hand.

## ✨ Key Features

- **Zero-Latency Client Engine**: The entire simulation runs instantly in the browser using a robust TypeScript engine.
- **Premium Glassmorphism UI**: Features a modern, dynamic interface with deep dark tones, vibrant accents, micro-animations, and glow effects that make the educational experience highly engaging.
- **Horizontal Tape Timeline**: An intuitive, visually rich scrubber allows users to navigate back and forth through the reference string effortlessly.
- **Algorithm State Visualizations**: Peek under the hood to see the exact data structures (queues, stacks, pointers) driving the eviction decisions live on the center stage.
- **Dynamic Explanations**: Every single step generates a human-readable explanation of *why* the algorithm made its choice.
- **Side-by-Side Comparison**: Run the same workload across all 4 algorithms instantly to generate comparative performance analytics.
- **Address Translation**: Explore the relationship between logical addresses, offsets, and physical frame addresses in memory.

## 🚀 Getting Started

The project is built with React, TypeScript, and Vite. There is no backend database required.

### Prerequisites
- [Node.js](https://nodejs.org/) (v16+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/virtual-memory-simulator.git
   cd virtual-memory-simulator/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Open your browser to `http://localhost:3000`.

## 🏗️ Architecture

The project recently underwent a major architectural redesign to prioritize educational clarity and performance:

```text
src/
├── engine/               # Pure TypeScript simulation engine
│   ├── types.ts          # Shared domain models
│   ├── algorithms.ts     # Self-explaining algorithm implementations
│   ├── scenarios.ts      # Educational workload presets
│   └── simulator.ts      # The core step-by-step state machine
├── components/           # React UI layer
│   ├── Sidebar.tsx               # Navigation between tools
│   ├── ConfigurePanel.tsx        # Workload and algorithm setup
│   ├── SimulatePanel.tsx         # The main visualizer with tape timeline
│   ├── ComparePanel.tsx          # Side-by-side analytics and charts
│   └── AddressTranslatorPanel.tsx# Maps logical to physical addresses
├── App.tsx               # High-level state router
└── App.css               # Global design tokens & glassmorphism styles
```

## 🛠️ Tech Stack

- **Framework**: React 18
- **Language**: TypeScript (Strict Mode)
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with a Premium Glassmorphism aesthetic, custom variables, and micro-animations
- **Charts**: Recharts

## 📝 License

This project is open-source and available under the MIT License. Feel free to use it for educational purposes, OS courses, or personal learning.
