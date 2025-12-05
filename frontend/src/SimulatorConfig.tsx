import React, { useState } from 'react';
import axios from 'axios';
import './SimulatorConfig.css';

interface Props {
  onSimulationComplete: (result: any) => void;
}

const SimulatorConfig: React.FC<Props> = ({ onSimulationComplete }) => {
  const [numFrames, setNumFrames] = useState<number>(4);
  const [algorithm, setAlgorithm] = useState<string>('LRU');
  const [scenario, setScenario] = useState<string>('thrashing');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const scenarios = [
    { value: 'thrashing', label: 'Thrashing' },
    { value: 'high_locality', label: 'High Locality' },
    { value: 'sequential_access', label: 'Sequential Access' },
    { value: 'segmentation_fragmentation', label: 'Segmentation & Fragmentation' }
  ];

  const algorithms = ['FIFO', 'LRU', 'CLOCK', 'Optimal', 'Random'];

  const handleLoadScenario = async () => {
    setLoading(true);
    setError('');

    try {
      // Load scenario file
      const scenarioResponse = await fetch(`/examples/scenarios/${scenario}.json`);
      const scenarioData = await scenarioResponse.json();

      // Run simulation via API
      const response = await axios.post('http://localhost:8000/run', {
        num_frames: numFrames,
        algorithm: algorithm,
        accesses: scenarioData.accesses,
        swap_latency_ms: 10.0,
        memory_latency_ms: 0.1
      });

      onSimulationComplete(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to run simulation');
      console.error('Simulation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="simulator-config">
      <h2>Configuration</h2>
      
      <div className="config-form">
        <div className="form-group">
          <label htmlFor="scenario">Scenario:</label>
          <select 
            id="scenario"
            value={scenario} 
            onChange={(e) => setScenario(e.target.value)}
            disabled={loading}
          >
            {scenarios.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="algorithm">Algorithm:</label>
          <select 
            id="algorithm"
            value={algorithm} 
            onChange={(e) => setAlgorithm(e.target.value)}
            disabled={loading}
          >
            {algorithms.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="frames">Number of Frames:</label>
          <input 
            id="frames"
            type="number" 
            min="1" 
            max="16"
            value={numFrames}
            onChange={(e) => setNumFrames(parseInt(e.target.value))}
            disabled={loading}
          />
        </div>

        <button 
          className="run-button" 
          onClick={handleLoadScenario}
          disabled={loading}
        >
          {loading ? 'Running...' : 'Run Simulation'}
        </button>

        {error && <div className="error-message">{error}</div>}
      </div>
    </div>
  );
};

export default SimulatorConfig;
