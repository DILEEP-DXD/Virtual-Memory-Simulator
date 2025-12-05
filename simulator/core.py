"""
Virtual Memory Simulator - Core Module

Implements the main simulation logic for paging and segmentation with timeline emission.
"""

import time
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, asdict
import copy


@dataclass
class Access:
    """Represents a memory access request."""
    pid: int
    page: int
    write: bool = False


@dataclass
class Frame:
    """Represents a physical memory frame."""
    frame: int
    pid: Optional[int] = None
    page: Optional[int] = None
    dirty: bool = False
    referenced: bool = False
    
    def to_dict(self):
        return asdict(self)


@dataclass
class PageTableEntry:
    """Represents a page table entry."""
    page: int
    valid: bool = False
    frame: Optional[int] = None
    dirty: bool = False
    referenced: bool = False
    
    def to_dict(self):
        return asdict(self)


class Simulator:
    """
    Main Virtual Memory Simulator.
    
    Simulates paging, page replacement algorithms, and generates a detailed timeline
    of memory operations including page faults, page-ins, and page-outs.
    """
    
    def __init__(self, num_frames: int, algorithm, page_size: int = 4096,
                 swap_latency_ms: int = 10, memory_latency_ms: int = 0.1):
        """
        Initialize the simulator.
        
        Args:
            num_frames: Number of physical memory frames
            algorithm: Page replacement algorithm instance
            page_size: Size of each page in bytes
            swap_latency_ms: Time to swap a page in/out (milliseconds)
            memory_latency_ms: Time to access memory (milliseconds)
        """
        self.num_frames = num_frames
        self.algorithm = algorithm
        self.page_size = page_size
        self.swap_latency_ms = swap_latency_ms
        self.memory_latency_ms = memory_latency_ms
        
        # Physical memory frames
        self.frames = [Frame(frame=i) for i in range(num_frames)]
        
        # Page tables for each process
        self.page_tables: Dict[int, List[PageTableEntry]] = {}
        
        # Statistics
        self.page_faults = 0
        self.page_ins = 0
        self.page_outs = 0
        self.hits = 0
        self.total_time_ms = 0
        
        # Timeline of events
        self.timeline = []
    
    def _ensure_page_table(self, pid: int, num_pages: int):
        """Ensure page table exists for process."""
        if pid not in self.page_tables:
            self.page_tables[pid] = [PageTableEntry(page=i) for i in range(num_pages)]
        else:
            # Extend if needed
            while len(self.page_tables[pid]) < num_pages:
                self.page_tables[pid].append(
                    PageTableEntry(page=len(self.page_tables[pid]))
                )
    
    def _find_frame(self, pid: int, page: int) -> Optional[int]:
        """Find frame containing the given page for the process."""
        for frame in self.frames:
            if frame.pid == pid and frame.page == page:
                return frame.frame
        return None
    
    def _get_victim_frame(self, access: Access) -> Optional[int]:
        """Select a victim frame for replacement."""
        # First check for free frames
        for frame in self.frames:
            if frame.pid is None:
                return frame.frame
        
        # No free frames, use algorithm to select victim
        return self.algorithm.select_victim(self.frames, access)
    
    def _evict_page(self, frame_num: int) -> Optional[Dict[str, Any]]:
        """
        Evict page from frame.
        
        Returns:
            Dict with eviction info or None if frame was empty
        """
        frame = self.frames[frame_num]
        if frame.pid is None:
            return None
        
        # Update page table
        pte = self.page_tables[frame.pid][frame.page]
        pte.valid = False
        pte.frame = None
        
        eviction_info = {
            'pid': frame.pid,
            'page': frame.page,
            'dirty': frame.dirty
        }
        
        # Write back if dirty
        if frame.dirty:
            self.page_outs += 1
            self.total_time_ms += self.swap_latency_ms
        
        return eviction_info
    
    def _load_page(self, access: Access, frame_num: int):
        """Load page into frame."""
        frame = self.frames[frame_num]
        frame.pid = access.pid
        frame.page = access.page
        frame.dirty = access.write
        frame.referenced = True
        
        # Update page table
        pte = self.page_tables[access.pid][access.page]
        pte.valid = True
        pte.frame = frame_num
        pte.dirty = access.write
        pte.referenced = True
        
        self.page_ins += 1
        self.total_time_ms += self.swap_latency_ms
    
    def _access_page(self, access: Access, frame_num: int):
        """Access an already-loaded page."""
        frame = self.frames[frame_num]
        frame.referenced = True
        if access.write:
            frame.dirty = True
        
        # Update page table
        pte = self.page_tables[access.pid][access.page]
        pte.referenced = True
        if access.write:
            pte.dirty = True
        
        self.total_time_ms += self.memory_latency_ms
    
    def _create_timeline_event(self, step: int, access: Access, hit: bool,
                              action: str) -> Dict[str, Any]:
        """Create a timeline event snapshot."""
        return {
            'step': step,
            'access': {'pid': access.pid, 'page': access.page, 'write': access.write},
            'hit': hit,
            'action': action,
            'frames': [f.to_dict() for f in self.frames],
            'page_tables': {
                str(pid): [pte.to_dict() for pte in table]
                for pid, table in self.page_tables.items()
            },
            'time_ms': round(self.total_time_ms, 3)
        }
    
    def run(self, accesses: List[Dict[str, Any]], max_pages_per_process: int = 100) -> Dict[str, Any]:
        """
        Run simulation on a sequence of memory accesses.
        
        Args:
            accesses: List of access dictionaries with 'pid', 'page', 'write' keys
            max_pages_per_process: Maximum number of pages per process
            
        Returns:
            Dictionary containing timeline and metrics
        """
        # Initialize algorithm with access sequence
        access_objects = [Access(**acc) for acc in accesses]
        self.algorithm.initialize(access_objects, self.num_frames)
        
        # Ensure page tables exist for all processes
        for acc in access_objects:
            self._ensure_page_table(acc.pid, max_pages_per_process)
        
        # Process each access
        for step, access in enumerate(access_objects, 1):
            # Check if page is in memory
            frame_num = self._find_frame(access.pid, access.page)
            
            if frame_num is not None:
                # Page hit
                self.hits += 1
                self._access_page(access, frame_num)
                self.algorithm.on_access(frame_num, access)
                
                action = f"hit (frame:{frame_num})"
                event = self._create_timeline_event(step, access, True, action)
            else:
                # Page fault
                self.page_faults += 1
                victim_frame = self._get_victim_frame(access)
                
                # Evict if necessary
                eviction_info = self._evict_page(victim_frame)
                
                # Load new page
                self._load_page(access, victim_frame)
                self.algorithm.on_page_in(victim_frame, access)
                
                # Build action description
                if eviction_info:
                    action = (f"page-in, evict (pid:{eviction_info['pid']},"
                            f"page:{eviction_info['page']}) "
                            f"dirty:{eviction_info['dirty']}")
                else:
                    action = "page-in (free frame)"
                
                event = self._create_timeline_event(step, access, False, action)
            
            self.timeline.append(event)
        
        # Compile results
        return {
            'timeline': self.timeline,
            'metrics': {
                'page_faults': self.page_faults,
                'page_ins': self.page_ins,
                'page_outs': self.page_outs,
                'hits': self.hits,
                'total_accesses': len(access_objects),
                'hit_ratio': self.hits / len(access_objects) if access_objects else 0,
                'avg_access_time_ms': self.total_time_ms / len(access_objects) if access_objects else 0
            },
            'config': {
                'num_frames': self.num_frames,
                'algorithm': self.algorithm.__class__.__name__,
                'page_size': self.page_size,
                'swap_latency_ms': self.swap_latency_ms,
                'memory_latency_ms': self.memory_latency_ms
            }
        }
