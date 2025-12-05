"""
FastAPI backend for Virtual Memory Simulator

Provides REST API endpoints for running simulations and generating reports.

Usage:
    uvicorn api.main:app --port 8000
    or
    python api/main.py
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import sys
from pathlib import Path

# Add simulator to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'simulator'))

from simulator.core import Simulator
from simulator.algorithms import get_algorithm
from simulator.metrics import analyze_timeline, compare_algorithms

app = FastAPI(title="Virtual Memory Simulator API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class MemoryAccess(BaseModel):
    """Memory access request."""
    pid: int
    page: int
    write: bool = False


class SimulationRequest(BaseModel):
    """Request to run a single simulation."""
    num_frames: int
    algorithm: str
    accesses: List[MemoryAccess]
    swap_latency_ms: float = 10.0
    memory_latency_ms: float = 0.1
    seed: Optional[int] = None


class BatchRequest(BaseModel):
    """Request to run batch simulations."""
    frame_counts: List[int]
    algorithms: List[str]
    accesses: List[MemoryAccess]
    swap_latency_ms: float = 10.0
    memory_latency_ms: float = 0.1


@app.get("/")
def root():
    """API root endpoint."""
    return {
        "name": "Virtual Memory Simulator API",
        "version": "1.0.0",
        "endpoints": {
            "run": "POST /run - Run a single simulation",
            "batch": "POST /batch - Run batch experiments",
            "report": "GET /report - Get aggregated statistics"
        }
    }


@app.post("/run")
def run_simulation(request: SimulationRequest) -> Dict[str, Any]:
    """
    Run a single simulation.
    
    Returns timeline JSON with events and metrics.
    """
    try:
        # Create algorithm
        algo_kwargs = {}
        if request.algorithm.upper() == 'RANDOM' and request.seed is not None:
            algo_kwargs['seed'] = request.seed
        
        algorithm = get_algorithm(request.algorithm, **algo_kwargs)
        
        # Create simulator
        simulator = Simulator(
            num_frames=request.num_frames,
            algorithm=algorithm,
            swap_latency_ms=request.swap_latency_ms,
            memory_latency_ms=request.memory_latency_ms
        )
        
        # Convert accesses to dict format
        accesses = [acc.dict() for acc in request.accesses]
        
        # Run simulation
        result = simulator.run(accesses)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Simulation error: {str(e)}")


@app.post("/batch")
def run_batch(request: BatchRequest) -> Dict[str, Any]:
    """
    Run batch experiments with multiple frame counts and algorithms.
    
    Returns aggregated results and comparison.
    """
    try:
        results = []
        accesses = [acc.dict() for acc in request.accesses]
        
        for frames in request.frame_counts:
            for algo_name in request.algorithms:
                # Create algorithm and simulator
                algorithm = get_algorithm(algo_name)
                simulator = Simulator(
                    num_frames=frames,
                    algorithm=algorithm,
                    swap_latency_ms=request.swap_latency_ms,
                    memory_latency_ms=request.memory_latency_ms
                )
                
                # Run simulation
                result = simulator.run(accesses)
                
                # Store result
                results.append({
                    'frames': frames,
                    'algorithm': algo_name,
                    'metrics': result['metrics'],
                    'config': result['config']
                })
        
        # Compare results
        comparison = compare_algorithms(results)
        
        return {
            'results': results,
            'comparison': comparison,
            'summary': {
                'total_experiments': len(results),
                'frame_counts': request.frame_counts,
                'algorithms': request.algorithms
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch simulation error: {str(e)}")


@app.get("/report")
def get_report() -> Dict[str, Any]:
    """
    Get aggregated statistics and report.
    
    This is a stub endpoint that returns example data.
    In a production system, this would query a database of past simulations.
    """
    return {
        "status": "ok",
        "message": "Report endpoint - In a production system, this would aggregate historical data",
        "example_stats": {
            "total_simulations_run": 0,
            "most_common_algorithm": "LRU",
            "average_hit_ratio": 0.75,
            "algorithms_available": ["FIFO", "LRU", "CLOCK", "Optimal", "Random"]
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
