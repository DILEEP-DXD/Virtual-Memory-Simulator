import React, { useState, useMemo } from 'react';
import { AlgorithmId, Access } from '../engine/types';
import { SCENARIOS } from '../engine/scenarios';

export interface SimConfig {
  algorithm: AlgorithmId;
  numFrames: number;
  accesses: Access[];
  speed: 'slow' | 'normal' | 'fast' | 'step';
}

interface ConfigurePanelProps {
  config: SimConfig;
  setConfig: React.Dispatch<React.SetStateAction<SimConfig>>;
  onRun: () => void;
}

const ALGORITHMS: { id: AlgorithmId; name: string; desc: string }[] = [
  { id: 'fifo', name: 'FIFO', desc: 'First-In, First-Out: Evicts the oldest loaded page.' },
  { id: 'lru', name: 'LRU', desc: 'Least Recently Used: Evicts the page unused for the longest time.' },
  { id: 'optimal', name: 'Optimal', desc: 'Evicts the page that will not be used for the longest time in the future.' },
  { id: 'clock', name: 'Clock', desc: 'Approximates LRU using a circular buffer and a reference bit.' },
];

export const ConfigurePanel: React.FC<ConfigurePanelProps> = ({ config, setConfig, onRun }) => {
  const [refMode, setRefMode] = useState<'preset' | 'custom'>('preset');
  const [presetId, setPresetId] = useState(SCENARIOS[0].id);
  const [presetLength, setPresetLength] = useState(40);
  const [customString, setCustomString] = useState('1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5');
  
  const handleAlgorithmChange = (id: AlgorithmId) => {
    setConfig(c => ({ ...c, algorithm: id }));
  };

  const customAccesses = useMemo(() => {
    if (refMode !== 'custom') return [];
    const parts = customString.replace(/,/g, ' ').split(/\s+/).filter(Boolean);
    return parts.map(p => {
      const num = parseInt(p, 10);
      return isNaN(num) ? null : { pid: 1, page: num, write: false };
    });
  }, [customString, refMode]);

  const hasCustomError = customAccesses.some(a => a === null);
  const validCustomAccesses = customAccesses.filter(Boolean) as Access[];

  const accesses = refMode === 'preset' 
    ? (SCENARIOS.find(s => s.id === presetId)?.accesses.slice(0, presetLength) || []) 
    : validCustomAccesses;

  const handleRun = () => {
    setConfig(c => ({ ...c, accesses }));
    onRun();
  };

  const activeAlg = ALGORITHMS.find(a => a.id === config.algorithm);

  return (
    <div className="panel configure-panel">
      <h2 className="panel-title">Configure Simulation</h2>

      <div className="form-row">
        <label className="form-label">Algorithm</label>
        <div className="toggle-group">
          {ALGORITHMS.map(alg => (
            <button
              key={alg.id}
              className={`toggle-btn ${config.algorithm === alg.id ? 'active' : ''}`}
              onClick={() => handleAlgorithmChange(alg.id)}
            >
              {alg.name}
            </button>
          ))}
        </div>
        <div className="toggle-desc">{activeAlg?.desc}</div>
      </div>

      <div className="form-row">
        <label className="form-label">Number of Frames ({config.numFrames})</label>
        <div className="stepper">
          <button 
            disabled={config.numFrames <= 1} 
            onClick={() => setConfig(c => ({...c, numFrames: c.numFrames - 1}))}
          >-</button>
          <span className="mono">{config.numFrames}</span>
          <button 
            disabled={config.numFrames >= 8} 
            onClick={() => setConfig(c => ({...c, numFrames: c.numFrames + 1}))}
          >+</button>
        </div>
        <div className="frame-preview">
          {Array.from({ length: config.numFrames }).map((_, i) => (
            <div key={i} className="frame-preview-slot mono" style={{ width: 'auto', padding: '0 4px', display: 'flex', alignItems: 'center', fontSize: '10px', color: 'var(--text-muted)' }}>F{i}</div>
          ))}
        </div>
      </div>

      <div className="form-row">
        <label className="form-label">Reference String</label>
        <div className="toggle-group" style={{ marginBottom: '1rem' }}>
          <button 
            className={`toggle-btn ${refMode === 'preset' ? 'active' : ''}`}
            onClick={() => setRefMode('preset')}
          >Preset</button>
          <button 
            className={`toggle-btn ${refMode === 'custom' ? 'active' : ''}`}
            onClick={() => setRefMode('custom')}
          >Custom</button>
        </div>

        {refMode === 'preset' ? (
          <div>
            <select 
              className="input-control" 
              value={presetId} 
              onChange={e => setPresetId(e.target.value)}
              style={{ marginBottom: '1rem' }}
            >
              {SCENARIOS.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <div style={{ marginTop: '1rem' }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Length ({presetLength} steps)</label>
              <input type="range" min={10} max={100} step={10} value={presetLength} onChange={e => setPresetLength(Number(e.target.value))} style={{ width: '100%', maxWidth: '400px', accentColor: 'var(--accent)' }} />
            </div>
          </div>
        ) : (
          <div>
            <input 
              type="text" 
              className="input-control mono" 
              value={customString}
              onChange={e => setCustomString(e.target.value)}
              placeholder="e.g. 1, 2, 3, 4"
            />
            {hasCustomError && <div style={{ color: '#ef4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>Error: Only numbers are allowed.</div>}
            <div className="text-muted" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{validCustomAccesses.length} pages</div>
            <div className="chip-container">
              {validCustomAccesses.map((acc, i) => {
                const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308'];
                const color = colors[acc.page % colors.length];
                return (
                  <div key={i} className="chip mono" style={{ backgroundColor: `${color}20`, borderColor: color, color: color }}>
                    {acc.page}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="form-row">
        <label className="form-label">Simulation Speed</label>
        <div className="toggle-group">
          {(['slow', 'normal', 'fast', 'step'] as const).map(s => (
            <button
              key={s}
              className={`toggle-btn ${config.speed === s ? 'active' : ''}`}
              onClick={() => setConfig(c => ({ ...c, speed: s }))}
              style={{ textTransform: 'capitalize' }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: '3rem' }}>
        <button className="btn-primary" onClick={handleRun} disabled={accesses.length === 0 || hasCustomError} style={{ width: '100%', justifyContent: 'center' }}>
          Run Simulation →
        </button>
      </div>
    </div>
  );
};
