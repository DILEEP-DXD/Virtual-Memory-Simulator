"""
I/O Module for Virtual Memory Simulator

Handles loading scenarios from JSON and writing timeline results to JSON.
"""

import json
from typing import Dict, Any, List


def load_scenario(path: str) -> Dict[str, Any]:
    """
    Load a simulation scenario from a JSON file.
    
    Args:
        path: Path to the scenario JSON file
        
    Returns:
        Dictionary containing scenario configuration with keys:
            - num_frames: Number of physical memory frames
            - algorithm: Name of the replacement algorithm
            - accesses: List of memory access dictionaries
            - config: Optional additional configuration
            
    Raises:
        FileNotFoundError: If the scenario file doesn't exist
        json.JSONDecodeError: If the JSON is malformed
        ValueError: If required fields are missing
    """
    with open(path, 'r') as f:
        scenario = json.load(f)
    
    # Validate required fields
    required_fields = ['num_frames', 'algorithm', 'accesses']
    for field in required_fields:
        if field not in scenario:
            raise ValueError(f"Scenario missing required field: {field}")
    
    # Validate accesses format
    if not isinstance(scenario['accesses'], list):
        raise ValueError("'accesses' must be a list")
    
    for i, access in enumerate(scenario['accesses']):
        if 'pid' not in access or 'page' not in access:
            raise ValueError(f"Access {i} missing 'pid' or 'page' field")
        if 'write' not in access:
            access['write'] = False  # Default to read
    
    return scenario


def write_timeline(timeline_data: Dict[str, Any], path: str):
    """
    Write simulation timeline to a JSON file.
    
    Args:
        timeline_data: Dictionary containing timeline, metrics, and config
        path: Output file path
    """
    with open(path, 'w') as f:
        json.dump(timeline_data, f, indent=2)


def generate_random_accesses(num_accesses: int, num_processes: int, 
                             num_pages: int, write_probability: float = 0.3,
                             seed: int = None) -> List[Dict[str, Any]]:
    """
    Generate a random sequence of memory accesses.
    
    Args:
        num_accesses: Number of accesses to generate
        num_processes: Number of processes
        num_pages: Number of pages per process
        write_probability: Probability of a write access (0.0 to 1.0)
        seed: Random seed for reproducibility
        
    Returns:
        List of access dictionaries
    """
    import random
    if seed is not None:
        random.seed(seed)
    
    accesses = []
    for _ in range(num_accesses):
        accesses.append({
            'pid': random.randint(1, num_processes),
            'page': random.randint(0, num_pages - 1),
            'write': random.random() < write_probability
        })
    
    return accesses


def generate_locality_accesses(num_accesses: int, pid: int = 1,
                               working_set_size: int = 5,
                               locality_probability: float = 0.8,
                               num_pages: int = 20,
                               seed: int = None) -> List[Dict[str, Any]]:
    """
    Generate memory accesses with spatial locality.
    
    Args:
        num_accesses: Number of accesses to generate
        pid: Process ID
        working_set_size: Size of the working set
        locality_probability: Probability of accessing within working set
        num_pages: Total number of pages
        seed: Random seed for reproducibility
        
    Returns:
        List of access dictionaries with high locality
    """
    import random
    if seed is not None:
        random.seed(seed)
    
    accesses = []
    working_set_base = 0
    
    for i in range(num_accesses):
        # Occasionally shift working set
        if i > 0 and i % 50 == 0:
            working_set_base = random.randint(0, max(0, num_pages - working_set_size))
        
        if random.random() < locality_probability:
            # Access within working set
            page = working_set_base + random.randint(0, working_set_size - 1)
        else:
            # Access outside working set
            page = random.randint(0, num_pages - 1)
        
        accesses.append({
            'pid': pid,
            'page': min(page, num_pages - 1),
            'write': random.random() < 0.3
        })
    
    return accesses


def generate_sequential_accesses(num_accesses: int, pid: int = 1,
                                 num_pages: int = 20) -> List[Dict[str, Any]]:
    """
    Generate sequential memory accesses.
    
    Args:
        num_accesses: Number of accesses to generate
        pid: Process ID
        num_pages: Total number of pages
        
    Returns:
        List of access dictionaries with sequential pattern
    """
    accesses = []
    for i in range(num_accesses):
        accesses.append({
            'pid': pid,
            'page': i % num_pages,
            'write': i % 4 == 0  # Every 4th access is a write
        })
    
    return accesses


def generate_thrashing_accesses(num_accesses: int, num_pages: int,
                                pid: int = 1) -> List[Dict[str, Any]]:
    """
    Generate memory accesses that cause thrashing.
    
    Creates a pattern where the working set exceeds available frames,
    causing frequent page faults.
    
    Args:
        num_accesses: Number of accesses to generate
        num_pages: Number of pages to cycle through (should exceed num_frames)
        pid: Process ID
        
    Returns:
        List of access dictionaries designed to cause thrashing
    """
    accesses = []
    for i in range(num_accesses):
        # Cycle through all pages repeatedly
        page = i % num_pages
        accesses.append({
            'pid': pid,
            'page': page,
            'write': False
        })
    
    return accesses
