import React, { useMemo, useState } from 'react';
import { runSimulation } from '../engine/simulator';
import { AlgorithmId } from '../engine/types';
import { SimConfig } from './ConfigurePanel';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

interface ComparePanelProps {
  config: SimConfig;
}

export const ComparePanel: React.FC<ComparePanelProps> = ({ config }) => {
  const [beladyEnabled, setBeladyEnabled] = useState(false);

  const algorithms: AlgorithmId[] = ['fifo', 'lru', 'optimal', 'clock'];
  
  const results = useMemo(() => {
    return algorithms.map(alg => runSimulation(alg, config.numFrames, config.accesses));
  }, [config.numFrames, config.accesses]);

  const beladyResults = useMemo(() => {
    if (!beladyEnabled) return null;
    return {
      frames3: runSimulation('fifo', 3, config.accesses),
      frames4: runSimulation('fifo', 4, config.accesses)
    };
  }, [beladyEnabled, config.accesses]);

  const chartData = algorithms.map((alg, i) => ({
    name: alg.toUpperCase(),
    Faults: results[i].totalFaults,
    Hits: results[i].totalHits
  }));

  const bestAlg = [...results].sort((a,b) => a.totalFaults - b.totalFaults)[0];
  const worstAlg = [...results].sort((a,b) => b.totalFaults - a.totalFaults)[0];

  return (
    <div className="panel compare-panel">
      <h2 className="panel-title">Compare Algorithms</h2>

      <div className="compare-grid">
        {results.map((res, i) => (
          <div key={algorithms[i]} className="card text-center">
            <h3>{algorithms[i].toUpperCase()}</h3>
            <div className="mono" style={{ fontSize: '2rem', color: 'var(--color-fault)', margin: '1rem 0' }}>
              {res.totalFaults}
            </div>
            <div className="text-muted">Faults</div>
            <div style={{ marginTop: '1rem' }}>
              Hits: <span className="mono">{res.totalHits}</span><br/>
              Ratio: <span className="mono">{(res.hitRatio * 100).toFixed(1)}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: '2rem', height: '400px' }}>
        <h3 style={{ marginBottom: '1rem', textAlign: 'center' }}>Total Faults & Hits</h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip contentStyle={{ backgroundColor: '#141416', borderColor: '#333' }} />
            <Legend />
            <Bar dataKey="Faults" fill="#ef4444" radius={[4,4,0,0]} />
            <Bar dataKey="Hits" fill="#22c55e" radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="insight-box" style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'rgba(108, 99, 255, 0.1)', borderRadius: '6px', border: '1px solid var(--accent)' }}>
        <h4 style={{ color: 'var(--accent)', marginBottom: '0.5rem' }}>Insight</h4>
        <p>
          <strong>{bestAlg.algorithm.toUpperCase()}</strong> performed best with {bestAlg.totalFaults} faults, while <strong>{worstAlg.algorithm.toUpperCase()}</strong> performed worst with {worstAlg.totalFaults} faults. 
          {bestAlg.algorithm === 'optimal' ? ' Optimal always provides the theoretical minimum faults, but cannot be implemented in real systems as it requires future knowledge.' : ''}
        </p>
      </div>

      <div className="card" style={{ marginTop: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>Belady's Anomaly Test (FIFO)</h3>
          <button className={`toggle-btn ${beladyEnabled ? 'active' : ''}`} onClick={() => setBeladyEnabled(!beladyEnabled)}>
            {beladyEnabled ? 'Hide' : 'Run Test'}
          </button>
        </div>
        {beladyEnabled && beladyResults && (
          <div>
            {beladyResults.frames4.totalFaults > beladyResults.frames3.totalFaults ? (
              <div style={{ padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--color-fault)', borderRadius: '6px', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--color-fault)', fontWeight: 'bold', marginBottom: '1rem' }}>
                  Anomaly detected! More frames → more faults ({beladyResults.frames3.totalFaults} vs {beladyResults.frames4.totalFaults})
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '2rem', height: '100px' }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ backgroundColor: 'var(--text-muted)', width: '40px', height: `${(beladyResults.frames3.totalFaults / beladyResults.frames4.totalFaults) * 80}px`, borderRadius: '4px 4px 0 0' }}></div>
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>3 Frames ({beladyResults.frames3.totalFaults})</div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                    <div style={{ backgroundColor: 'var(--color-fault)', width: '40px', height: '80px', borderRadius: '4px 4px 0 0' }}></div>
                    <div style={{ marginTop: '8px', fontSize: '12px' }}>4 Frames ({beladyResults.frames4.totalFaults})</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ padding: '1rem', backgroundColor: 'rgba(34, 197, 94, 0.1)', border: '1px solid var(--color-hit)', borderRadius: '6px', marginBottom: '1rem' }}>
                <div style={{ color: 'var(--color-hit)', fontWeight: 'bold' }}>
                  No anomaly on this reference string. Try the Thrashing preset — it demonstrates Belady's Anomaly reliably.
                </div>
              </div>
            )}
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>
              Belady's Anomaly: FIFO can produce MORE page faults with MORE frames. LRU and Optimal are stack algorithms — they never exhibit this anomaly.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
