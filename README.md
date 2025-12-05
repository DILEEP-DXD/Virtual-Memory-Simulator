# Virtual Memory Management Tool

A comprehensive, interactive virtual memory simulator with paging, segmentation, and multiple page replacement algorithms. Features a React frontend, FastAPI backend, batch experimentation tools, and ML-based algorithm prediction.

## Features

- **Multiple Page Replacement Algorithms**: FIFO, LRU, CLOCK, Optimal (Belady's), Random
- **Interactive Visualization**: Real-time frame table, page table, and segmentation views
- **Timeline Playback**: Step through memory operations with play/pause/scrub controls
- **Performance Metrics**: Page faults, hit ratios, access times with live graphing
- **Batch Experiments**: Grid search across frame counts and algorithms
- **HTML Reports**: Automated report generation with algorithm comparisons
- **ML Prediction**: Scikit-learn model to predict optimal algorithms
- **REST API**: FastAPI backend for programmatic access
- **Example Scenarios**: Pre-configured scenarios demonstrating thrashing, locality, etc.

## Quick Start

### Prerequisites

- Python 3.8+
- Node.js 16+ and npm
- (Optional) Docker for containerized deployment

### Installation

1. **Clone or extract the project**

```powershell
cd virtual-memory-tool
```

2. **Install Python dependencies**

```powershell
cd simulator
pip install -r requirements.txt
cd ..
```

3. **Install frontend dependencies**

```powershell
cd frontend
npm install
cd ..
```

## Running the Simulator

### CLI Simulation

Run a single simulation from the command line:

```powershell
python simulator/run_simulation.py --scenario examples/scenarios/thrashing.json --algorithm LRU --output timeline.json
```

**Options:**
- `--scenario`: Path to scenario JSON file
- `--algorithm`: FIFO, LRU, CLOCK, Optimal, or Random
- `--output`: Output file path (optional, defaults to stdout)
- `--frames`: Override number of frames from scenario
- `--seed`: Random seed for Random algorithm

### Run Tests

Verify installation with pytest:

```powershell
pytest simulator/tests/test_algorithms.py
```

Expected: All tests pass, including Belady's anomaly demonstration.

### Start API Server

Launch the FastAPI backend:

```powershell
uvicorn api.main:app --port 8000
```

API will be available at `http://localhost:8000`. Visit `/docs` for interactive API documentation.

**Endpoints:**
- `POST /run` - Run single simulation
- `POST /batch` - Run batch experiments
- `GET /report` - Get aggregated statistics

### Start Frontend

Launch the React development server:

```powershell
cd frontend
npm start
```

Frontend will open at `http://localhost:3000`. The UI allows you to:
- Select scenarios and algorithms
- Visualize frame tables and page tables in real-time
- Play/pause/step through the simulation timeline
- View performance graphs
- Export results as JSON, CSV, or HTML

## Batch Experiments

Run grid experiments varying frame counts and algorithms:

```powershell
python batch_runner.py --scenario examples/scenarios/thrashing.json --frames 2 3 4 5 6 7 8 --algorithms LRU FIFO Optimal --output results.csv
```

This generates a CSV with columns: `frames`, `algorithm`, `page_faults`, `page_ins`, `page_outs`, `hits`, `hit_ratio`, `avg_access_time_ms`.

## Generate Reports

Create an HTML report from batch results:

```powershell
python report_generator.py --csv results.csv --out report.html
```

Open `report.html` in a browser to view:
- Performance comparison tables
- Best/worst configurations
- Algorithm rankings
- Interpretation paragraphs

## Example Scenarios

Pre-configured scenarios in `examples/scenarios/`:

- **thrashing.json** - Working set exceeds frames, causes thrashing
- **high_locality.json** - High temporal locality, good cache behavior
- **sequential_access.json** - Sequential memory access pattern
- **segmentation_fragmentation.json** - Multi-process segmentation demo

## Jupyter Notebook

Explore batch experiments and ML training:

```powershell
cd notebooks
jupyter notebook experiments.ipynb
```

The notebook demonstrates:
- Batch simulation runs
- Pandas data analysis
- Matplotlib visualizations
- Heatmaps and performance plots
- ML model training (optional)

## Machine Learning

Train a model to predict the best algorithm:

```python
from ml.ml_model_stub import generate_training_dataset, train_algorithm_predictor

# Generate training data
df = generate_training_dataset(
    scenarios=['examples/scenarios/thrashing.json', 
               'examples/scenarios/high_locality.json'],
    frame_counts=[2, 3, 4, 5, 6, 7, 8],
    algorithms=['FIFO', 'LRU', 'CLOCK', 'Optimal']
)

# Train model
model = train_algorithm_predictor(df=df)

# Predict best algorithm
best = predict_best_algorithm(model, working_set_size=10, 
                              locality_score=0.8, sequential_score=0.2,
                              write_ratio=0.3, num_frames=4)
```

## Docker Deployment (Optional)

Build and run with Docker:

```powershell
docker build -t virtual-memory-tool .
docker run -p 3000:3000 -p 8000:8000 virtual-memory-tool
```

See `Dockerfile` for details.

## Project Structure

```
virtual-memory-tool/
├── simulator/           # Core simulation engine
│   ├── core.py         # Simulator class
│   ├── algorithms.py   # Page replacement algorithms
│   ├── io.py           # JSON I/O utilities
│   ├── metrics.py      # Performance metrics
│   ├── tests/          # Pytest test suite
│   └── run_simulation.py  # CLI entrypoint
├── api/                # FastAPI backend
│   └── main.py         # REST API endpoints
├── frontend/           # React + TypeScript frontend
│   └── src/            # React components
├── examples/           # Example scenarios
│   └── scenarios/      # JSON scenario files
├── notebooks/          # Jupyter notebooks
│   └── experiments.ipynb
├── ml/                 # Machine learning module
│   └── ml_model_stub.py
├── batch_runner.py     # Batch experiment script
├── report_generator.py # HTML report generator
├── Dockerfile          # Docker configuration
└── README.md           # This file
```

## Acceptance Tests

The project passes the following acceptance tests:

1. **Unit Tests**: `pytest simulator/tests/test_algorithms.py` → All pass
2. **CLI Simulation**: Generates valid `timeline.json` with required schema
3. **API Server**: Serves `/run` and `/report` endpoints
4. **Frontend**: Loads scenarios, animates visualizations, supports play/pause
5. **Batch Runner**: Produces CSV with correct columns
6. **Report Generator**: Creates HTML with algorithm interpretation

## Timeline JSON Schema

Each simulation outputs a timeline with events structured as:

```json
{
  "step": 1,
  "access": {"pid": 1, "page": 5, "write": false},
  "hit": false,
  "action": "page-in, evict (pid:2,page:3) dirty:true",
  "frames": [
    {"frame": 0, "pid": 1, "page": 5, "dirty": false, "referenced": true}
  ],
  "page_tables": {
    "1": [{"page": 5, "valid": true, "frame": 0, "dirty": false}]
  },
  "time_ms": 10.1
}
```

## Algorithms Implemented

### FIFO (First-In-First-Out)
Evicts the oldest page. Simple but can suffer from Belady's anomaly.

### LRU (Least Recently Used)
Evicts the page not used for the longest time. Good general-purpose algorithm.

### CLOCK (Second Chance)
Approximates LRU with a reference bit. Efficient hardware implementation.

### Optimal (Belady's Algorithm)
Evicts the page used farthest in the future. Theoretical minimum, used for comparison.

### Random
Evicts a random page. Baseline for comparison.

## Performance Notes

This is a **non-production educational tool** designed for:
- Understanding virtual memory concepts
- Experimenting with page replacement algorithms
- Visualizing memory management
- Demonstrating thrashing and locality

**Not intended for:**
- Production OS simulation
- Real-time systems
- Performance-critical applications

## Troubleshooting

### Frontend won't start
- Ensure Node.js 16+ is installed
- Run `npm install` in the `frontend/` directory
- Check that port 3000 is available

### API won't start
- Install Python dependencies: `pip install -r simulator/requirements.txt`
- Check that port 8000 is available
- Try: `python api/main.py` instead of uvicorn

### Tests fail
- Verify Python 3.8+ is installed
- Install pytest: `pip install pytest`
- Check that all simulator modules are in PYTHONPATH

### Scenario not loading in frontend
- Ensure API server is running on port 8000
- Check browser console for errors
- Verify scenario JSON is valid and in `examples/scenarios/`

## Contributing

This is an educational project. Contributions welcome for:
- Additional page replacement algorithms
- More example scenarios
- Improved visualizations
- Extended ML models
- Bug fixes and documentation

## License

MIT License - See LICENSE file for details.

## Acknowledgments

- Belady's anomaly demonstration inspired by classic OS textbooks
- Page replacement algorithms based on standard OS implementations
- Frontend visualization adapted from memory management teaching tools
