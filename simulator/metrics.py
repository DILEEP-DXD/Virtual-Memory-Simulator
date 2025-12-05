"""
Metrics Collection Module

Provides utilities for calculating and analyzing simulation metrics.
"""

from typing import Dict, Any, List


class MetricsCollector:
    """
    Collects and calculates metrics from simulation runs.
    """
    
    def __init__(self):
        self.page_faults = 0
        self.page_ins = 0
        self.page_outs = 0
        self.hits = 0
        self.total_accesses = 0
        self.total_time_ms = 0
    
    def update_from_timeline(self, timeline: List[Dict[str, Any]]):
        """
        Extract metrics from a timeline.
        
        Args:
            timeline: List of timeline events from simulation
        """
        self.total_accesses = len(timeline)
        self.page_faults = sum(1 for event in timeline if not event['hit'])
        self.hits = sum(1 for event in timeline if event['hit'])
        
        # Count page-ins and page-outs from actions
        for event in timeline:
            action = event['action']
            if 'page-in' in action:
                self.page_ins += 1
            if 'dirty:true' in action or 'dirty: true' in action:
                self.page_outs += 1
        
        # Get final time
        if timeline:
            self.total_time_ms = timeline[-1]['time_ms']
    
    def calculate_metrics(self) -> Dict[str, float]:
        """
        Calculate all metrics.
        
        Returns:
            Dictionary with calculated metrics
        """
        hit_ratio = self.hits / self.total_accesses if self.total_accesses > 0 else 0
        fault_rate = self.page_faults / self.total_accesses if self.total_accesses > 0 else 0
        avg_access_time = self.total_time_ms / self.total_accesses if self.total_accesses > 0 else 0
        
        return {
            'page_faults': self.page_faults,
            'page_ins': self.page_ins,
            'page_outs': self.page_outs,
            'hits': self.hits,
            'total_accesses': self.total_accesses,
            'hit_ratio': round(hit_ratio, 4),
            'fault_rate': round(fault_rate, 4),
            'avg_access_time_ms': round(avg_access_time, 4),
            'total_time_ms': round(self.total_time_ms, 4)
        }
    
    def reset(self):
        """Reset all metrics to zero."""
        self.page_faults = 0
        self.page_ins = 0
        self.page_outs = 0
        self.hits = 0
        self.total_accesses = 0
        self.total_time_ms = 0


def calculate_hit_ratio(hits: int, total_accesses: int) -> float:
    """
    Calculate hit ratio.
    
    Args:
        hits: Number of page hits
        total_accesses: Total number of accesses
        
    Returns:
        Hit ratio (0.0 to 1.0)
    """
    return hits / total_accesses if total_accesses > 0 else 0


def calculate_avg_access_time(total_time_ms: float, total_accesses: int,
                              memory_latency_ms: float = 0.1,
                              swap_latency_ms: float = 10) -> float:
    """
    Calculate average memory access time.
    
    Args:
        total_time_ms: Total simulated time in milliseconds
        total_accesses: Total number of accesses
        memory_latency_ms: Memory access latency
        swap_latency_ms: Swap operation latency
        
    Returns:
        Average access time in milliseconds
    """
    return total_time_ms / total_accesses if total_accesses > 0 else 0


def calculate_effective_access_time(hit_ratio: float,
                                   memory_latency_ms: float = 0.1,
                                   swap_latency_ms: float = 10) -> float:
    """
    Calculate effective access time (EAT).
    
    EAT = hit_ratio * memory_latency + (1 - hit_ratio) * (memory_latency + swap_latency)
    
    Args:
        hit_ratio: Page hit ratio (0.0 to 1.0)
        memory_latency_ms: Memory access latency
        swap_latency_ms: Swap operation latency
        
    Returns:
        Effective access time in milliseconds
    """
    miss_ratio = 1 - hit_ratio
    eat = (hit_ratio * memory_latency_ms + 
           miss_ratio * (memory_latency_ms + swap_latency_ms))
    return eat


def analyze_timeline(timeline_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Perform comprehensive analysis of simulation results.
    
    Args:
        timeline_data: Full simulation output with timeline and metrics
        
    Returns:
        Dictionary with detailed analysis
    """
    timeline = timeline_data.get('timeline', [])
    metrics = timeline_data.get('metrics', {})
    config = timeline_data.get('config', {})
    
    # Collect metrics
    collector = MetricsCollector()
    collector.update_from_timeline(timeline)
    calculated_metrics = collector.calculate_metrics()
    
    # Calculate additional metrics
    hit_ratio = calculated_metrics['hit_ratio']
    memory_latency = config.get('memory_latency_ms', 0.1)
    swap_latency = config.get('swap_latency_ms', 10)
    
    effective_access_time = calculate_effective_access_time(
        hit_ratio, memory_latency, swap_latency
    )
    
    # Analyze page fault patterns
    fault_intervals = []
    last_fault = 0
    for i, event in enumerate(timeline):
        if not event['hit']:
            if last_fault > 0:
                fault_intervals.append(i - last_fault)
            last_fault = i
    
    avg_fault_interval = (sum(fault_intervals) / len(fault_intervals) 
                         if fault_intervals else 0)
    
    return {
        'metrics': calculated_metrics,
        'effective_access_time_ms': round(effective_access_time, 4),
        'avg_fault_interval': round(avg_fault_interval, 2),
        'config': config,
        'summary': generate_summary(calculated_metrics, config)
    }


def generate_summary(metrics: Dict[str, Any], config: Dict[str, Any]) -> str:
    """
    Generate a human-readable summary of the simulation.
    
    Args:
        metrics: Calculated metrics dictionary
        config: Simulation configuration
        
    Returns:
        Summary string
    """
    algorithm = config.get('algorithm', 'Unknown')
    num_frames = config.get('num_frames', 'Unknown')
    
    summary = f"Simulation with {algorithm} algorithm and {num_frames} frames:\n"
    summary += f"  Total accesses: {metrics['total_accesses']}\n"
    summary += f"  Page faults: {metrics['page_faults']} ({metrics['fault_rate']*100:.1f}%)\n"
    summary += f"  Hits: {metrics['hits']} (hit ratio: {metrics['hit_ratio']*100:.1f}%)\n"
    summary += f"  Page-ins: {metrics['page_ins']}, Page-outs: {metrics['page_outs']}\n"
    summary += f"  Average access time: {metrics['avg_access_time_ms']:.4f} ms\n"
    
    return summary


def compare_algorithms(results: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Compare results from multiple algorithm runs.
    
    Args:
        results: List of simulation result dictionaries
        
    Returns:
        Comparison dictionary with rankings and analysis
    """
    if not results:
        return {}
    
    # Extract metrics for comparison
    comparisons = []
    for result in results:
        metrics = result.get('metrics', {})
        config = result.get('config', {})
        comparisons.append({
            'algorithm': config.get('algorithm', 'Unknown'),
            'frames': config.get('num_frames', 0),
            'page_faults': metrics.get('page_faults', 0),
            'hit_ratio': metrics.get('hit_ratio', 0),
            'avg_access_time_ms': metrics.get('avg_access_time_ms', 0)
        })
    
    # Sort by page faults (lower is better)
    sorted_by_faults = sorted(comparisons, key=lambda x: x['page_faults'])
    
    # Sort by hit ratio (higher is better)
    sorted_by_hits = sorted(comparisons, key=lambda x: x['hit_ratio'], reverse=True)
    
    return {
        'best_by_page_faults': sorted_by_faults[0] if sorted_by_faults else None,
        'worst_by_page_faults': sorted_by_faults[-1] if sorted_by_faults else None,
        'best_by_hit_ratio': sorted_by_hits[0] if sorted_by_hits else None,
        'all_results': comparisons
    }
