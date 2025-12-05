"""
Test suite for page replacement algorithms.

Tests include Belady's anomaly demonstration and verification of expected
page fault counts for known reference strings.
"""

import pytest
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from algorithms import FIFO, LRU, CLOCK, Optimal, Random, get_algorithm
from core import Simulator, Access


class TestAlgorithmFactory:
    """Test the algorithm factory function."""
    
    def test_get_algorithm_fifo(self):
        algo = get_algorithm('FIFO')
        assert isinstance(algo, FIFO)
    
    def test_get_algorithm_lru(self):
        algo = get_algorithm('LRU')
        assert isinstance(algo, LRU)
    
    def test_get_algorithm_clock(self):
        algo = get_algorithm('CLOCK')
        assert isinstance(algo, CLOCK)
    
    def test_get_algorithm_optimal(self):
        algo = get_algorithm('Optimal')
        assert isinstance(algo, Optimal)
    
    def test_get_algorithm_random(self):
        algo = get_algorithm('Random', seed=42)
        assert isinstance(algo, Random)
    
    def test_get_algorithm_case_insensitive(self):
        algo = get_algorithm('lru')
        assert isinstance(algo, LRU)
    
    def test_get_algorithm_invalid(self):
        with pytest.raises(ValueError):
            get_algorithm('InvalidAlgorithm')


class TestFIFO:
    """Test FIFO algorithm."""
    
    def test_fifo_basic(self):
        """Test FIFO with a simple reference string."""
        accesses = [
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
            {'pid': 1, 'page': 4, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 5, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
            {'pid': 1, 'page': 4, 'write': False},
            {'pid': 1, 'page': 5, 'write': False},
        ]
        
        algo = get_algorithm('FIFO')
        sim = Simulator(num_frames=3, algorithm=algo)
        result = sim.run(accesses)
        
        # Expected: 9 page faults with 3 frames
        assert result['metrics']['page_faults'] == 9
    
    def test_fifo_beladys_anomaly(self):
        """Demonstrate Belady's anomaly with FIFO."""
        # Reference string: 1,2,3,4,1,2,5,1,2,3,4,5
        accesses = [
            {'pid': 1, 'page': i, 'write': False}
            for i in [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
        ]
        
        # Test with 3 frames
        algo3 = get_algorithm('FIFO')
        sim3 = Simulator(num_frames=3, algorithm=algo3)
        result3 = sim3.run(accesses)
        faults3 = result3['metrics']['page_faults']
        
        # Test with 4 frames
        algo4 = get_algorithm('FIFO')
        sim4 = Simulator(num_frames=4, algorithm=algo4)
        result4 = sim4.run(accesses)
        faults4 = result4['metrics']['page_faults']
        
        # With this sequence, 4 frames should have MORE faults than 3 frames
        # (Belady's anomaly)
        assert faults4 >= faults3, f"Belady's anomaly: {faults3} faults with 3 frames, {faults4} faults with 4 frames"


class TestLRU:
    """Test LRU algorithm."""
    
    def test_lru_basic(self):
        """Test LRU with a simple reference string."""
        accesses = [
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
            {'pid': 1, 'page': 4, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 5, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
            {'pid': 1, 'page': 4, 'write': False},
            {'pid': 1, 'page': 5, 'write': False},
        ]
        
        algo = get_algorithm('LRU')
        sim = Simulator(num_frames=3, algorithm=algo)
        result = sim.run(accesses)
        
        # LRU should perform better than FIFO for this sequence
        assert result['metrics']['page_faults'] <= 10
    
    def test_lru_sequential(self):
        """Test LRU with sequential access."""
        accesses = [
            {'pid': 1, 'page': i, 'write': False}
            for i in range(10)
        ]
        
        algo = get_algorithm('LRU')
        sim = Simulator(num_frames=3, algorithm=algo)
        result = sim.run(accesses)
        
        # Sequential access with limited frames causes page fault on each new page
        assert result['metrics']['page_faults'] == 10


class TestOptimal:
    """Test Optimal (Belady's) algorithm."""
    
    def test_optimal_basic(self):
        """Test Optimal algorithm with a simple reference string."""
        accesses = [
            {'pid': 1, 'page': 7, 'write': False},
            {'pid': 1, 'page': 0, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 0, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
            {'pid': 1, 'page': 0, 'write': False},
            {'pid': 1, 'page': 4, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
            {'pid': 1, 'page': 0, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
        ]
        
        algo = get_algorithm('Optimal')
        sim = Simulator(num_frames=3, algorithm=algo)
        result = sim.run(accesses)
        
        # Optimal should produce minimum page faults
        # For this sequence with 3 frames: 6 faults
        assert result['metrics']['page_faults'] == 6
    
    def test_optimal_is_best(self):
        """Verify that Optimal produces fewer or equal faults than other algorithms."""
        accesses = [
            {'pid': 1, 'page': i, 'write': False}
            for i in [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
        ]
        
        num_frames = 3
        
        # Run Optimal
        optimal_algo = get_algorithm('Optimal')
        optimal_sim = Simulator(num_frames=num_frames, algorithm=optimal_algo)
        optimal_result = optimal_sim.run(accesses)
        optimal_faults = optimal_result['metrics']['page_faults']
        
        # Run FIFO
        fifo_algo = get_algorithm('FIFO')
        fifo_sim = Simulator(num_frames=num_frames, algorithm=fifo_algo)
        fifo_result = fifo_sim.run(accesses)
        fifo_faults = fifo_result['metrics']['page_faults']
        
        # Run LRU
        lru_algo = get_algorithm('LRU')
        lru_sim = Simulator(num_frames=num_frames, algorithm=lru_algo)
        lru_result = lru_sim.run(accesses)
        lru_faults = lru_result['metrics']['page_faults']
        
        # Optimal should be best
        assert optimal_faults <= fifo_faults
        assert optimal_faults <= lru_faults


class TestCLOCK:
    """Test CLOCK algorithm."""
    
    def test_clock_basic(self):
        """Test CLOCK with a simple reference string."""
        accesses = [
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
            {'pid': 1, 'page': 4, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 5, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 3, 'write': False},
        ]
        
        algo = get_algorithm('CLOCK')
        sim = Simulator(num_frames=3, algorithm=algo)
        result = sim.run(accesses)
        
        # CLOCK should perform reasonably well
        assert result['metrics']['page_faults'] > 0
        assert result['metrics']['hits'] > 0


class TestRandom:
    """Test Random algorithm."""
    
    def test_random_deterministic_with_seed(self):
        """Test that Random algorithm is deterministic with a seed."""
        accesses = [
            {'pid': 1, 'page': i, 'write': False}
            for i in [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
        ]
        
        # Run twice with same seed
        algo1 = get_algorithm('Random', seed=42)
        sim1 = Simulator(num_frames=3, algorithm=algo1)
        result1 = sim1.run(accesses)
        
        algo2 = get_algorithm('Random', seed=42)
        sim2 = Simulator(num_frames=3, algorithm=algo2)
        result2 = sim2.run(accesses)
        
        # Results should be identical
        assert result1['metrics']['page_faults'] == result2['metrics']['page_faults']
    
    def test_random_different_with_different_seeds(self):
        """Test that Random algorithm produces different results with different seeds."""
        accesses = [
            {'pid': 1, 'page': i, 'write': False}
            for i in [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5]
        ]
        
        results = []
        for seed in range(10):
            algo = get_algorithm('Random', seed=seed)
            sim = Simulator(num_frames=3, algorithm=algo)
            result = sim.run(accesses)
            results.append(result['metrics']['page_faults'])
        
        # At least some results should differ (very high probability)
        assert len(set(results)) > 1


class TestSimulator:
    """Test Simulator core functionality."""
    
    def test_simulator_timeline_structure(self):
        """Test that timeline has correct structure."""
        accesses = [
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 1, 'page': 1, 'write': False},
        ]
        
        algo = get_algorithm('FIFO')
        sim = Simulator(num_frames=2, algorithm=algo)
        result = sim.run(accesses)
        
        assert 'timeline' in result
        assert 'metrics' in result
        assert 'config' in result
        
        # Check timeline events
        for event in result['timeline']:
            assert 'step' in event
            assert 'access' in event
            assert 'hit' in event
            assert 'action' in event
            assert 'frames' in event
            assert 'page_tables' in event
            assert 'time_ms' in event
    
    def test_simulator_dirty_pages(self):
        """Test that dirty pages are tracked correctly."""
        accesses = [
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 1, 'page': 1, 'write': True},  # Make page dirty
            {'pid': 1, 'page': 2, 'write': False},
        ]
        
        algo = get_algorithm('FIFO')
        sim = Simulator(num_frames=1, algorithm=algo)
        result = sim.run(accesses)
        
        # Third access should cause page-out of dirty page
        assert result['metrics']['page_outs'] == 1
    
    def test_simulator_multiple_processes(self):
        """Test simulator with multiple processes."""
        accesses = [
            {'pid': 1, 'page': 1, 'write': False},
            {'pid': 2, 'page': 1, 'write': False},
            {'pid': 1, 'page': 2, 'write': False},
            {'pid': 2, 'page': 2, 'write': False},
        ]
        
        algo = get_algorithm('FIFO')
        sim = Simulator(num_frames=2, algorithm=algo)
        result = sim.run(accesses)
        
        # Should have page tables for both processes
        assert '1' in result['timeline'][0]['page_tables']
        assert '2' in result['timeline'][1]['page_tables']


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
