"""
Batch Runner for Virtual Memory Simulator

Runs grid experiments varying frames and algorithms, outputs results to CSV.

Usage:
    python batch_runner.py --scenario examples/scenarios/thrashing.json --frames 2 3 4 5 6 7 8 --algorithms LRU FIFO Optimal
"""

import argparse
import csv
import sys
from pathlib import Path

# Add simulator directory to path
sys.path.insert(0, str(Path(__file__).parent / 'simulator'))

from simulator.core import Simulator
from simulator.algorithms import get_algorithm
from simulator.io import load_scenario


def run_batch_experiments(scenario_path: str, frame_counts: list, algorithms: list, 
                         output_csv: str = 'results.csv'):
    """
    Run batch experiments with different frame counts and algorithms.
    
    Args:
        scenario_path: Path to scenario JSON file
        frame_counts: List of frame counts to test
        algorithms: List of algorithm names to test
        output_csv: Output CSV file path
    """
    # Load scenario
    scenario = load_scenario(scenario_path)
    accesses = scenario['accesses']
    
    results = []
    total_runs = len(frame_counts) * len(algorithms)
    current_run = 0
    
    print(f"Running {total_runs} experiments...", file=sys.stderr)
    
    for frames in frame_counts:
        for algo_name in algorithms:
            current_run += 1
            print(f"[{current_run}/{total_runs}] Frames: {frames}, Algorithm: {algo_name}", 
                  file=sys.stderr)
            
            try:
                # Create algorithm and simulator
                algorithm = get_algorithm(algo_name)
                simulator = Simulator(num_frames=frames, algorithm=algorithm)
                
                # Run simulation
                result = simulator.run(accesses)
                metrics = result['metrics']
                
                # Collect results
                results.append({
                    'frames': frames,
                    'algorithm': algo_name,
                    'page_faults': metrics['page_faults'],
                    'page_ins': metrics['page_ins'],
                    'page_outs': metrics['page_outs'],
                    'hits': metrics['hits'],
                    'hit_ratio': metrics['hit_ratio'],
                    'avg_access_time_ms': metrics['avg_access_time_ms'],
                    'total_accesses': metrics['total_accesses']
                })
                
            except Exception as e:
                print(f"Error running experiment: {e}", file=sys.stderr)
                continue
    
    # Write results to CSV
    if results:
        fieldnames = ['frames', 'algorithm', 'page_faults', 'page_ins', 'page_outs', 
                     'hits', 'hit_ratio', 'avg_access_time_ms', 'total_accesses']
        
        with open(output_csv, 'w', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(results)
        
        print(f"\nResults written to {output_csv}", file=sys.stderr)
        print(f"Total experiments: {len(results)}", file=sys.stderr)
    else:
        print("No results to write!", file=sys.stderr)
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description='Run batch experiments on virtual memory simulation')
    parser.add_argument('--scenario', required=True, help='Path to scenario JSON file')
    parser.add_argument('--frames', nargs='+', type=int, required=True,
                       help='List of frame counts to test')
    parser.add_argument('--algorithms', nargs='+', required=True,
                       choices=['FIFO', 'LRU', 'CLOCK', 'Optimal', 'Random'],
                       help='List of algorithms to test')
    parser.add_argument('--output', default='results.csv', 
                       help='Output CSV file (default: results.csv)')
    
    args = parser.parse_args()
    
    run_batch_experiments(
        scenario_path=args.scenario,
        frame_counts=args.frames,
        algorithms=args.algorithms,
        output_csv=args.output
    )


if __name__ == '__main__':
    main()
