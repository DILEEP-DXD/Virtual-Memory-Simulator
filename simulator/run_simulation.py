"""
CLI runner for virtual memory simulation.

Usage:
    python run_simulation.py --scenario examples/scenarios/thrashing.json --algorithm LRU --output /tmp/timeline.json
"""

import argparse
import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from core import Simulator
from algorithms import get_algorithm
from io import load_scenario, write_timeline


def main():
    parser = argparse.ArgumentParser(description='Run virtual memory simulation')
    parser.add_argument('--scenario', required=True, help='Path to scenario JSON file')
    parser.add_argument('--algorithm', required=True, 
                       choices=['FIFO', 'LRU', 'CLOCK', 'Optimal', 'Random'],
                       help='Page replacement algorithm')
    parser.add_argument('--output', help='Output file path (default: stdout)')
    parser.add_argument('--frames', type=int, help='Override number of frames from scenario')
    parser.add_argument('--seed', type=int, help='Random seed for Random algorithm')
    parser.add_argument('--swap-latency', type=float, default=10.0,
                       help='Swap latency in milliseconds (default: 10)')
    parser.add_argument('--memory-latency', type=float, default=0.1,
                       help='Memory latency in milliseconds (default: 0.1)')
    
    args = parser.parse_args()
    
    # Load scenario
    try:
        scenario = load_scenario(args.scenario)
    except Exception as e:
        print(f"Error loading scenario: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Get configuration
    num_frames = args.frames if args.frames else scenario['num_frames']
    accesses = scenario['accesses']
    
    # Create algorithm
    algo_kwargs = {}
    if args.algorithm == 'Random' and args.seed is not None:
        algo_kwargs['seed'] = args.seed
    
    try:
        algorithm = get_algorithm(args.algorithm, **algo_kwargs)
    except Exception as e:
        print(f"Error creating algorithm: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Create simulator
    simulator = Simulator(
        num_frames=num_frames,
        algorithm=algorithm,
        swap_latency_ms=args.swap_latency,
        memory_latency_ms=args.memory_latency
    )
    
    # Run simulation
    print(f"Running simulation with {args.algorithm} algorithm, {num_frames} frames...", 
          file=sys.stderr)
    
    try:
        result = simulator.run(accesses)
    except Exception as e:
        print(f"Error running simulation: {e}", file=sys.stderr)
        sys.exit(1)
    
    # Output results
    if args.output:
        try:
            write_timeline(result, args.output)
            print(f"Results written to {args.output}", file=sys.stderr)
        except Exception as e:
            print(f"Error writing output: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        # Print to stdout
        print(json.dumps(result, indent=2))
    
    # Print summary to stderr
    metrics = result['metrics']
    print("\nSimulation Summary:", file=sys.stderr)
    print(f"  Total accesses: {metrics['total_accesses']}", file=sys.stderr)
    print(f"  Page faults: {metrics['page_faults']}", file=sys.stderr)
    print(f"  Hits: {metrics['hits']}", file=sys.stderr)
    print(f"  Hit ratio: {metrics['hit_ratio']:.2%}", file=sys.stderr)
    print(f"  Page-ins: {metrics['page_ins']}", file=sys.stderr)
    print(f"  Page-outs: {metrics['page_outs']}", file=sys.stderr)
    print(f"  Avg access time: {metrics['avg_access_time_ms']:.4f} ms", file=sys.stderr)


if __name__ == '__main__':
    main()
