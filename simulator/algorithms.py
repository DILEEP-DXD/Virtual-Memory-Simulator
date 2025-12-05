"""
Page Replacement Algorithms

Implements various page replacement algorithms: FIFO, LRU, CLOCK, Optimal, and Random.
"""

from typing import List, Optional
from abc import ABC, abstractmethod
import random
from collections import deque


class ReplacementAlgorithm(ABC):
    """Base class for page replacement algorithms."""
    
    @abstractmethod
    def initialize(self, accesses: List, num_frames: int):
        """Initialize algorithm with access sequence and frame count."""
        pass
    
    @abstractmethod
    def select_victim(self, frames: List, current_access) -> int:
        """Select a victim frame for replacement."""
        pass
    
    def on_access(self, frame_num: int, access):
        """Called when a page is accessed (hit)."""
        pass
    
    def on_page_in(self, frame_num: int, access):
        """Called when a page is loaded into a frame."""
        pass


class FIFO(ReplacementAlgorithm):
    """First-In-First-Out page replacement algorithm."""
    
    def __init__(self):
        self.queue = deque()
    
    def initialize(self, accesses: List, num_frames: int):
        """Initialize FIFO queue."""
        self.queue = deque()
    
    def select_victim(self, frames: List, current_access) -> int:
        """Select the oldest page (first in queue)."""
        if not self.queue:
            return 0
        return self.queue[0]
    
    def on_page_in(self, frame_num: int, access):
        """Add frame to queue when page is loaded."""
        if frame_num in self.queue:
            self.queue.remove(frame_num)
        self.queue.append(frame_num)


class LRU(ReplacementAlgorithm):
    """Least Recently Used page replacement algorithm."""
    
    def __init__(self):
        self.access_times = {}
        self.clock = 0
    
    def initialize(self, accesses: List, num_frames: int):
        """Initialize LRU tracking."""
        self.access_times = {}
        self.clock = 0
    
    def select_victim(self, frames: List, current_access) -> int:
        """Select the least recently used frame."""
        min_time = float('inf')
        victim = 0
        
        for frame in frames:
            if frame.pid is not None:
                time = self.access_times.get(frame.frame, 0)
                if time < min_time:
                    min_time = time
                    victim = frame.frame
        
        return victim
    
    def on_access(self, frame_num: int, access):
        """Update access time on hit."""
        self.clock += 1
        self.access_times[frame_num] = self.clock
    
    def on_page_in(self, frame_num: int, access):
        """Update access time on page-in."""
        self.clock += 1
        self.access_times[frame_num] = self.clock


class CLOCK(ReplacementAlgorithm):
    """Clock (Second Chance) page replacement algorithm."""
    
    def __init__(self):
        self.hand = 0
        self.num_frames = 0
    
    def initialize(self, accesses: List, num_frames: int):
        """Initialize clock hand."""
        self.hand = 0
        self.num_frames = num_frames
    
    def select_victim(self, frames: List, current_access) -> int:
        """Select victim using clock algorithm."""
        checked = 0
        
        while checked < self.num_frames * 2:  # At most two full cycles
            frame = frames[self.hand]
            
            if frame.pid is None:
                # Free frame
                victim = self.hand
                self.hand = (self.hand + 1) % self.num_frames
                return victim
            
            if frame.referenced:
                # Give second chance
                frame.referenced = False
            else:
                # Victim found
                victim = self.hand
                self.hand = (self.hand + 1) % self.num_frames
                return victim
            
            self.hand = (self.hand + 1) % self.num_frames
            checked += 1
        
        # Fallback: select current hand position
        victim = self.hand
        self.hand = (self.hand + 1) % self.num_frames
        return victim
    
    def on_access(self, frame_num: int, access):
        """Mark frame as referenced on access."""
        # Referenced bit is already set in the Frame object
        pass


class Optimal(ReplacementAlgorithm):
    """Optimal (Belady's) page replacement algorithm."""
    
    def __init__(self):
        self.future_accesses = []
        self.current_index = 0
    
    def initialize(self, accesses: List, num_frames: int):
        """Store future access sequence."""
        self.future_accesses = accesses
        self.current_index = 0
    
    def select_victim(self, frames: List, current_access) -> int:
        """Select the frame that will be used farthest in the future."""
        max_distance = -1
        victim = 0
        
        for frame in frames:
            if frame.pid is None:
                continue
            
            # Find next use of this page
            distance = float('inf')
            for i in range(self.current_index + 1, len(self.future_accesses)):
                future_access = self.future_accesses[i]
                if future_access.pid == frame.pid and future_access.page == frame.page:
                    distance = i - self.current_index
                    break
            
            if distance > max_distance:
                max_distance = distance
                victim = frame.frame
        
        return victim
    
    def on_access(self, frame_num: int, access):
        """Track current position in access sequence."""
        self.current_index += 1
    
    def on_page_in(self, frame_num: int, access):
        """Track current position in access sequence."""
        self.current_index += 1


class Random(ReplacementAlgorithm):
    """Random page replacement algorithm."""
    
    def __init__(self, seed: Optional[int] = None):
        """
        Initialize random algorithm.
        
        Args:
            seed: Random seed for reproducibility
        """
        self.seed = seed
        self.rng = random.Random(seed)
    
    def initialize(self, accesses: List, num_frames: int):
        """Reset random number generator."""
        self.rng = random.Random(self.seed)
    
    def select_victim(self, frames: List, current_access) -> int:
        """Select a random victim frame."""
        occupied_frames = [f.frame for f in frames if f.pid is not None]
        if not occupied_frames:
            return 0
        return self.rng.choice(occupied_frames)


def get_algorithm(name: str, **kwargs) -> ReplacementAlgorithm:
    """
    Factory function to get a replacement algorithm by name.
    
    Args:
        name: Algorithm name (FIFO, LRU, CLOCK, Optimal, Random)
        **kwargs: Additional arguments for the algorithm
        
    Returns:
        ReplacementAlgorithm instance
        
    Raises:
        ValueError: If algorithm name is not recognized
    """
    algorithms = {
        'FIFO': FIFO,
        'LRU': LRU,
        'CLOCK': CLOCK,
        'Optimal': Optimal,
        'Random': Random
    }
    
    name_upper = name.upper()
    if name_upper not in algorithms:
        raise ValueError(f"Unknown algorithm: {name}. Available: {list(algorithms.keys())}")
    
    return algorithms[name_upper](**kwargs)
